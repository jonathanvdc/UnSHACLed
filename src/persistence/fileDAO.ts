/// <reference path="./dataAccessObject.d.ts"/>
/// <reference path="./parser.d.ts"/>

import * as Collections from "typescript-collections";
import {Model, ModelComponent, ModelData, ModelTaskMetadata} from "../entities/model";
import {ProcessorTask} from "../entities/taskProcessor";
import {Component} from "./component";
import {GraphParser} from "./graphParser";

/**
 * Provides basic DAO functionality at the file granularity level.
 */
export class FileDAO implements DataAccessObject {
    private model: Model;
    private io: IOFacilitator;

    /**
     * Create a new FileDAO
     */
    public constructor(model: Model) {
        this.model = model;
        this.io = new IOFacilitator();

        // register modems
        this.io.registerModem(new GraphParser());
    }

    /**
     * Create a new file.
     * @param module
     */
    public insert(module: any) {
        this.model.tasks.schedule(new SaveTask(this.io, module));
        this.model.tasks.processTask();
    }

    /**
     * Load an existing file.
     * @param module
     */
    public find(module: any) {
        let model = this.model;
        this.io.readFromFile(module, function(result: any) {
            model.tasks.schedule(new LoadTask(result, module));
            model.tasks.processTask();
        });
    }

    /**
     * Save an existing file.
     * @param module
     */
    public update(module: any) {
        // updating actually just means downloading an updated copy
        // i.e. creating a new file
        this.insert(module);
    }
}

/**
 * Provides basic input/output functionality w.r.t. files.
 * Requires a particular modem to modulate between file format and internal representation.
 */
class IOFacilitator {
    private modems: Collections.Dictionary<ModelComponent, Parser>;

    /**
     * Create a new IOFacilitator.
     * @param {Modem} modem
     */
    public constructor() {
        this.modems = new Collections.Dictionary<ModelComponent, Parser>();
    }

    public registerModem(parser: Parser) {
        this.modems.setValue(parser.getLabel(), parser);
    }

    /**
     * Read from an existing file.
     * @returns {Graph}
     * @param module
     * @param save
     */
    public readFromFile(module: FileModule, save: (result: any) => void) {
        let reader = new FileReader();
        reader.readAsText(module.getFile());
        reader.onload = onLoadFunction;
        reader.onloadend = onLoadEndFunction;

        let modem = this.modems.getValue(module.getType());
        // every time a portion is loaded, demodulate this portion of content
        // and aggregate the result (this happens internally).
        function onLoadFunction(evt: any) {
            modem.parse(evt.target.result, module.getFile().type);
        }

        // when we are finished loading, retrieve the aggregated result
        // and clean the modem.
        function onLoadEndFunction(evt: any) {
            // as reading is asynchronous, we can only save the result
            // at this point.
            save(modem.getData());
            modem.clean();
        }
    }

    /**
     * Write to a file.
     * @param module
     * @param data
     */
    public writeToFile(module: FileModule, data: any) {
        let FileSaver = require("file-saver");
        // retrieve the modulated content (i.e. in textual format)
        let content = this.modems.getValue(module.getType()).serialize(data, module.getFile().type);
        // write to file
        let file = new File([content], module.getFilename());
        FileSaver.saveAs(file);
    }
}

/**
 * A single persistence directive.
 * Contains all the necessary information to carry out a persistence operation.
 */
export class FileModule implements Module {
    private type: ModelComponent;
    private filename: string;
    private file: Blob;

    /**
     * Create a new FileModule.
     * @param {ModelComponent} type
     * @param {string} filename
     * @param {Blob} file
     */
    public constructor(type: ModelComponent, filename: string, file: Blob) {
        this.type = type;
        this.filename = filename;
        this.file = file;
    }

    /**
     * Return the designated ModelComponent.
     * @returns {ModelComponent}
     */
    getType(): ModelComponent {
        return this.type;
    }

    /**
     * Return the filename.
     * @returns {string}
     */
    getFilename(): string {
        return this.filename;
    }

    /**
     * Return the Blob representing the file.
     * @returns {Blob}
     */
    getFile(): Blob {
        return this.file;
    }
}

/**
 * A ProcessorTask that reads a file and adds its contents as a component to the Model.
 */
class LoadTask extends ProcessorTask<ModelData, ModelTaskMetadata> {

    /**
     * Create a new LoadTask.
     * Contains a function that will execute on the model.
     * This function saves information to the model, which was read from file.
     * @param result
     * @param {FileModule} module
     */
    public constructor(result: any, module: FileModule) {
        super(function(data: ModelData) {
            let component: Component = data.getComponent(module.getType());
            if (component == null || component === undefined) {
                component = new Component();
            }
            component.setPart(module.getFilename(), result);
            data.setComponent(module.getType(), component);
        },    null);
    }
}

/**
 * A ProcessorTask that retrieves a component from the Model and writes its contents to a file.
 */
class SaveTask extends ProcessorTask<ModelData, ModelTaskMetadata> {

    /**
     * Create a new SaveTask.
     * Contains a function that will execute on the model.
     * This function loads information from the model and writes this to file.
     * @param {IOFacilitator} io
     * @param {FileModule} module
     */
    public constructor(io: IOFacilitator, module: FileModule) {
        super(function(data: ModelData) {
            let component: Component = data.getComponent(module.getType());
            if (component != null && component !== undefined) {
                io.writeToFile(module, component.getPart(module.getFilename()));
            }
        },    null);
    }
}
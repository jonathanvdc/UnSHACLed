import * as Collections from "typescript-collections";
import { InOrderProcessor, TaskProcessor } from "./taskProcessor";
import { ModelComponent, ModelTaskMetadata } from "./modelTaskMetadata";
import { ModelData } from "./modelData";
import { Task, OpaqueTask } from "./task";
import { ModelTask, OpaqueModelTask } from "./taskInstruction";
import { OutOfOrderProcessor } from "./outOfOrderProcessor";
export { ModelData } from "./modelData";
export { ModelTask, OpaqueModelTask } from "./taskInstruction";

/**
 * A model observer: a function that takes a change set as input
 * and produces a list of tasks to process as output.
 */
type ModelObserver = (changeBuffer: Collections.Set<ModelComponent>) => Array<ModelTask>;

/**
 * Models the data handled by the UnSHACLed application.
 */
export class Model {
    /**
     * The task processor for the model.
     * 
     * NOTE: don't try to run tasks on the Model immediately by calling
     * `processTask`. There are two reasons for why this is a bad idea:
     * 
     *   * The UI should call `processTask` when it knows that
     *     it has time to do some processing. Other components shouldn't.
     * 
     *   * More fundamentally, tasks are not processed in a LIFO order,
     *     so the task you're trying to process using `processTask` may
     *     not be the task you queued.
     */
    public readonly tasks: TaskProcessor<ModelData, ModelTaskMetadata>;

    private observers: ModelObserver[];

    /**
     * Creates a model.
     * 
     * NOTE: an application like UnSHACLed should contain only *one*
     * Model instance. If you're in doubt about whether you should
     * create a new Model instance or not, you probably shouldn't.
     * Grab a Model from a singleton somewhere.
     * 
     * This constructor exists mostly for testing purposes.
     */
    public constructor(data?: ModelData) {
        let wellDefinedData = !data ? new ModelData() : data;
        this.tasks = new OutOfOrderProcessor(
            wellDefinedData,
            task => task,
            task => task,
            task => this.notifyObservers(wellDefinedData.drainChangeBuffer()));
        this.observers = [];
    }

    /**
     * Creates a task for the model.
     * @param execute The task itself: a function that manipulates model data.
     * @param readSet The set of all values from which the model task may read.
     * It includes elements in the write set that are modified based on their
     * previous value, as opposed to blindly overwritten.
     * @param writeSet The set of all values to which the model task writes.
     * @param priority An optional priority for the task.
     */
    public static createTask(
        execute: (data: ModelData) => void,
        readSet: Collections.Set<ModelComponent> | ModelComponent[],
        writeSet: Collections.Set<ModelComponent> | ModelComponent[],
        priority?: number):
        OpaqueModelTask {

        return new OpaqueTask<ModelData, ModelTaskMetadata>(
            execute,
            new ModelTaskMetadata(readSet, writeSet, priority));
    }

    /**
     * Registers an observer with the model. Observers are notified when
     * a task completes and may queue additional tasks based on the changes
     * made to components.
     */
    public registerObserver(observer: ModelObserver): void {
        this.observers.push(observer);
    }

    private notifyObservers(changeBuffer: Collections.Set<ModelComponent>): void {
        this.observers.forEach(element => {
            element(changeBuffer).forEach(newTask => {
                this.tasks.schedule(newTask);
            });
        });
    }
}
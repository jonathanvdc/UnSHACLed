import axios from 'axios';

/**
 * RequestModule class which serves several http requests functions for interaction
 * with bot the collaboration server as well as the GitHub API to other components
 * of the application.
 */

class RequestModule {

    /**
     * Method to receive a token from the collaboration server.
     * A POST request is used to obtain the token in a plain text from the collaboration server.
     * The obtained token is used for further authenticatio
     * @returns {Promise<AxiosResponse<any>>}, Return the obtained token through a promise.
     */
    static getToken() {
        return axios.post('http://193.190.127.184:8042/auth/request-token')
            .then(res => res.data);
    }

    /**
     * Method to start authentication process through the collaboration server using
     * a GET request with the earlier obtained token. The collaboration server will redirect
     * to the GitHub login page and redirect if logged in succesfully
     * @param token: token associated with authenticated user and obtained using getToken().
     */
    static AuthWithToken(token: any) {
        window.open('http://193.190.127.184:8042/auth/auth/' + token, "_blank",
            "top=100,left=500,width=500,height=1000");
    }

    /**
     * Method to check wether or not a user with an obtained token is authenticated using a
     * GET request to the collaboration server including the previously obtained token
     * @param token: token associated with authenticated user and obtained using getToken().
     * @returns {Promise<AxiosResponse<any>>}, Returns either true or false through a promise.
     */
    static isAuthenticated(token: any) {
        return axios.get('http://193.190.127.184:8042/auth/is-authenticated/' + token)
            .then(res => res.data);
    }

    /**
     * Method to obtain user info for an authenticated user
     * @param type: specifies type of user info, can be 'login', 'name' or 'email'.
     * @param token: token associated with authenticated user and obtained using getToken().
     * @returns {Promise<AxiosResponse<any>>}, Returns the requested user info through a promise.
     */
    static getUserInfo(type: any, token: any) {
        console.log('http://193.190.127.184:8042/user/' + type + '/' + token);
        return axios.get('http://193.190.127.184:8042/user/' + type + '/' + token)
            .then(res => res.data);
    }

    /**
     * Method to obatin user object from GitHub API
     * @param login: login from authenticated user
     * @returns {Promise<AxiosResponse<any>>}, return user object through a promise.
     */
    static getUserObject(login: any) {
        return axios.get('https://api.github.com/users/' + login)
            .then(res => res.data);
    }

    /**
     * Method to grab a list of a user's repositories
     * @param token: token associated with authenticated user and obtained using getToken().
     * @returns {Promise<AxiosResponse<any>>}, return list of repo through a promise.
     */
    static getUserRepos(token: any) {
        console.log('http://193.190.127.184:8042/user/repo-list/' + token);
        return axios.get('http://193.190.127.184:8042/user/repo-list/' + token)
            .then(res => res.data);
    }

    /**
     * Method that will map an array of repos required from the API to
     * an array able to be loaded in a Dropdown UI component.
     * @param repoArray
     */
    static processRepos(repoArray: any) {
        let result: any[] = [];
        for (let i in repoArray) {
            result.push(
                {
                    text: repoArray[i].split("/")[1],
                    value: repoArray[i].split("/")[1]
                }
            );
        }
        return result;
    }

    /**
     * Method to update or create a file. Lock on file is required to do so.
     * @param repoOwner: owner of repository where file is located
     * @param repoName: name of repository
     * @param token: token associated with authenticated user and obtained using getToken().
     * @param fileName: name of file to be created updated
     * @param file: file content, incorporated in body of http request
     */
    static updateFile(repoOwner: any, repoName: any, token: any, fileName: any, file: any) {
        console.log(
            'http://193.190.127.184:8042/repo/file/' + repoOwner + '/' + repoName + '/' + token + '/' + fileName);
        const target =
            'http://193.190.127.184:8042/repo/file/' + repoOwner + '/' + repoName + '/' + token + '/' + fileName;
        axios.post(target, {file})
            .then(res => console.log(res));
    }

    // TODO replace lock method with one generic method
    /**
     * Method to check wether user has a lock on a file.
     * @param repoOwner: owner of repository where file is located
     * @param repoName: name of repository
     * @param token: token associated with authenticated user and obtained using getToken().
     * @param filePath: path of file to be created updated
     * @returns {Promise<AxiosResponse<any>>}, return true if lock has been granted, false otherwise through a Promise.
     */
    static hasLock(repoOwner: any, repoName: any, token: any, filePath: any) {
        const target =
            'http://193.190.127.184:8042/repo/has-lock/' + repoOwner + '/' + repoName + '/' + token + '/' + filePath;
        return axios.get(target)
            .then(res => res.data);
    }

    /**
     * Method to request a lock on a file.
     * @param repoOwner: owner of repository where file is located
     * @param repoName: name of repository
     * @param token: token associated with authenticated user and obtained using getToken().
     * @param filePath: path of file to be created updated
     * @returns {Promise<AxiosResponse<any>>}, return true if lock has been granted, false otherwise through a Promise.
     */
    static requestLock(repoOwner: any, repoName: any, token: any, filePath: any) {
        const target = 'http://193.190.127.184:8042/repo/request-lock/'
            + repoOwner + '/' + repoName + '/' + token + '/' + filePath;
        return axios.post(target)
            .then(res => res.data);
    }

}

export default RequestModule;
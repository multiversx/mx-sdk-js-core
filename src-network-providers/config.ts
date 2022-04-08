import { IPagination } from "./interface";

const JSONbig = require("json-bigint");

export const defaultAxiosConfig = {
    timeout: 1000,
    // See: https://github.com/axios/axios/issues/983 regarding transformResponse
    transformResponse: [
        function (data: any) {
            return JSONbig.parse(data);
        }
    ]
};

export const defaultPagination: IPagination = {
    from: 0,
    size: 100
};

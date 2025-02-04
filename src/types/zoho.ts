// API Response type
export interface ZohoAPIResponse<T> {
  data: T[];
  info: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

// SDK Response type
export interface ZohoResponse {
  getStatusCode(): number;
  getObject(): any;
}

export interface Deal {
  id: string;
  [key: string]: any; // Allow for dynamic deal properties
}

export interface DealUpdate {
  Serial_1?: string;
  Serial_2?: string;
  Serial_3?: string;
  Serial_4?: string;
}

export interface ZohoErrorResponse {
  code: string;
  details: {
    api_name: string;
    [key: string]: any;
  };
  message: string;
  status: string;
}

export interface ZohoRecord {
  addKeyValue(key: string, value: any): void;
  getId(): string;
  getKeyValue(key: string): any;
}

export interface ZohoSDKTypes {
  Record: {
    Operations: new (moduleAPIName: string) => {
      updateRecord(
        recordId: bigint,
        request: any,
        headerInstance?: HeaderMap
      ): Promise<ZohoResponse>;
      getRecords(
        paramInstance?: ParameterMap,
        headerInstance?: HeaderMap
      ): Promise<ZohoResponse>;
    };
    Model: {
      GetRecordsParam: {
        FIELDS: string;
        PER_PAGE: string;
        [key: string]: string;
      };
      BodyWrapper: new () => {
        setData(records: ZohoRecord[]): void;
      };
      Record: new () => ZohoRecord;
      ResponseWrapper: new () => {
        getData(): ZohoRecord[];
      };
      APIException: new () => {
        getStatus(): { getValue(): string };
        getCode(): { getValue(): string };
        getMessage(): { getValue(): string };
        getDetails(): Map<string, any>;
      };
      ActionWrapper: new () => {
        getData(): Array<{
          getStatus(): { getValue(): string };
          getCode(): { getValue(): string };
          getMessage(): { getValue(): string };
          getDetails(): Map<string, any>;
        }>;
      };
      SuccessResponse: new () => {
        getStatus(): { getValue(): string };
        getCode(): { getValue(): string };
        getMessage(): { getValue(): string };
        getDetails(): Map<string, any>;
      };
    };
  };
}

export interface GetRecordsParams {
  fields?: string;
  [key: string]: string | undefined;
}

export interface Parameter {
  getName(): string;
  getValue(): string;
}

export interface ParameterMap {
  add(name: string, value: string): Promise<void>;
  get(key: string): string | null;
  getParameterMap(): Map<string, string>;
}

export interface HeaderMap {
  add(name: string, value: string): void;
  get(key: string): string | null;
  getHeaderMap(): Map<string, string>;
}

// These are global types that exist in the Zoho SDK
declare const ParameterMap: new () => ParameterMap;
declare const HeaderMap: new () => HeaderMap;
declare const Choice: new (value: string) => any;

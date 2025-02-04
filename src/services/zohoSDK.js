import { initializeZohoSDK } from './zohoInitializer';

class Records {
  static isLoading = false;
  static cachedDeals = null;

  static async getRecords(moduleAPIName) {
    // Only allow fetching Deals
    if (moduleAPIName !== "Deals") {
      console.error('Only Deals module is supported');
      return [];
    }

    try {
      // Get instance of RecordOperations Class
      let recordOperations = new ZCRM.Record.Operations(moduleAPIName);
      console.log('Created record operations for Deals module');

      // Get instance of ParameterMap Class
      let paramInstance = new ParameterMap();

      // Specify the fields we want to retrieve
      const fieldNames = ["id", "Deal_Name", "Model_1", "Model_2", "Model_3", "Model_4", "Serial_1", "Serial_2", "Serial_3", "Serial_4"];
      console.log('Setting up request with fields:', fieldNames.join(","));

      // Add parameters
      await paramInstance.add(ZCRM.Record.Model.GetRecordsParam.FIELDS, fieldNames.toString());
      await paramInstance.add(ZCRM.Record.Model.GetRecordsParam.PER_PAGE, 10);

      // Get instance of HeaderMap Class
      let headerInstance = new HeaderMap();

      // Get records with the specified fields
      let response = await recordOperations.getRecords(paramInstance, headerInstance);
      console.log('Got response from Zoho API');

      if (!response) {
        console.error('No response from Zoho API');
        return [];
      }

      const statusCode = response.getStatusCode();
      console.log("Status Code:", statusCode);

      if ([204, 304].includes(statusCode)) {
        console.log(statusCode === 204 ? "No Content" : "Not Modified");
        return [];
      }

      let responseObject = response.getObject();
      if (!responseObject) {
        console.error('No response object from Zoho API');
        return [];
      }

      if (responseObject instanceof ZCRM.Record.Model.ResponseWrapper) {
        let records = responseObject.getData();
        // Transform records into our Deal format
        let validRecords = records.filter(record => {
          try {
            // Verify we can access Deal_Name (required for dropdown)
            let dealName = record.getKeyValue('Deal_Name');
            let id = record.getId();

            // Log the record data for debugging
            console.log('Processing record:', {
              id,
              dealName,
              model1: record.getKeyValue('Model_1'),
              model2: record.getKeyValue('Model_2'),
              model3: record.getKeyValue('Model_3'),
              model4: record.getKeyValue('Model_4')
            });

            return id && dealName;
          } catch (error) {
            console.error('Error validating record:', error);
            return false;
          }
        }).map(record => ({
          id: record.getId(),
          Deal_Name: record.getKeyValue('Deal_Name'),
          Model_1: record.getKeyValue('Model_1'),
          Model_2: record.getKeyValue('Model_2'),
          Model_3: record.getKeyValue('Model_3'),
          Model_4: record.getKeyValue('Model_4'),
          Serial_1: record.getKeyValue('Serial_1'),
          Serial_2: record.getKeyValue('Serial_2'),
          Serial_3: record.getKeyValue('Serial_3'),
          Serial_4: record.getKeyValue('Serial_4')
        }));

        console.log(`Found ${validRecords.length} valid deals`);
        this.cachedDeals = validRecords;
        return validRecords;
      } else if (responseObject instanceof ZCRM.Record.Model.APIException) {
        const errorDetails = {
          status: responseObject.getStatus()?.getValue(),
          code: responseObject.getCode()?.getValue(),
          message: responseObject.getMessage()?.getValue(),
          details: responseObject.getDetails()
        };
        console.error('API Exception:', errorDetails);
        throw new Error(JSON.stringify(errorDetails));
      }

      return [];
    } catch (error) {
      console.error('Failed to get records:', error);
      throw error;
    }
  }

  static async updateRecord(moduleAPIName, recordId, input) {
    try {
      // Get instance of RecordOperations Class
      let recordOperations = new ZCRM.Record.Operations(moduleAPIName);

      // Get instance of BodyWrapper Class that will contain the request body
      let request = new ZCRM.Record.Model.BodyWrapper();

      // Array to hold Record instances
      let recordsArray = [];

      // Get instance of Record Class
      let record = new ZCRM.Record.Model.Record();

      if (input != null) {
        Object.entries(input).forEach(([key, value]) => {
          record.addKeyValue(key, value);
        });
      }

      // Add Record instance to the array
      recordsArray.push(record);

      // Set the array to Records in BodyWrapper instance
      request.setData(recordsArray);

      // Get instance of HeaderMap Class
      let headerInstance = new HeaderMap();

      let response = await recordOperations.updateRecord(BigInt(recordId), request, headerInstance);

      if (response != null) {
        console.log("Status Code:", response.getStatusCode());
        let responseObject = response.getObject();

        if (responseObject instanceof ZCRM.Record.Model.ActionWrapper) {
          let actionResponses = responseObject.getData();
          return actionResponses[0];
        }
      }
    } catch (error) {
      console.error('Failed to update record:', error);
      throw error;
    }
  }
}

function deals() {
  return {
    update: async function (id, input) {
      return await Records.updateRecord("Deals", id, input);
    },

    get: async function () {
      return await Records.getRecords("Deals");
    }
  }
}

const initialize = async () => {
  await initializeZohoSDK();
}

const ZohoCRMClient = {
  Deals: deals(),
  init: initialize
};

export const zohoSDK = {
  getDeals: async () => {
    return await ZohoCRMClient.Deals.get();
  },
  updateDeal: async (id, input) => {
    return await ZohoCRMClient.Deals.update(id, input);
  },
  init: ZohoCRMClient.init
};

export default ZohoCRMClient; 
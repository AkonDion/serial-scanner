import { initializeZohoSDK } from './zohoInitializer';

class Records {
  static isLoading = false;
  static cachedDeals = null;
  static CACHE_KEY = 'zoho_cached_deals';
  static CACHE_TIMESTAMP_KEY = 'zoho_cache_timestamp';
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  static initializationPromise = null;

  static async initialize() {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        await initializeZohoSDK();
        // Start prefetching deals immediately after SDK initialization
        this.prefetchDeals();
      } catch (error) {
        console.error('Failed to initialize Zoho SDK:', error);
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  static async prefetchDeals() {
    try {
      // Check cache first
      if (!this.cachedDeals) {
        this.loadCacheFromStorage();
      }

      // If no cache, fetch fresh data
      if (!this.cachedDeals) {
        console.log('Prefetching deals data...');
        await this.getRecords('Deals');
      }
    } catch (error) {
      console.warn('Failed to prefetch deals:', error);
    }
  }

  static loadCacheFromStorage() {
    try {
      const timestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
      const now = Date.now();

      // Check if cache is still valid (within 5 minutes)
      if (timestamp && (now - parseInt(timestamp)) < this.CACHE_DURATION) {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
          this.cachedDeals = JSON.parse(cached);
          console.log('Loaded deals from localStorage cache');
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
    return false;
  }

  static saveCacheToStorage(deals) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(deals));
      localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Saved deals to localStorage cache');
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  static async getRecords(moduleAPIName) {
    // Only allow fetching Deals
    if (moduleAPIName !== "Deals") {
      console.error('Only Deals module is supported');
      return [];
    }

    // Try to load from cache first
    if (!this.cachedDeals) {
      this.loadCacheFromStorage();
    }

    if (this.cachedDeals) {
      return this.cachedDeals;
    }

    try {
      // Get instance of RecordOperations Class
      let recordOperations = new ZCRM.Record.Operations(moduleAPIName);

      // Get instance of ParameterMap Class
      let paramInstance = new ParameterMap();

      // Specify the fields we want to retrieve
      const fieldNames = ["id", "Deal_Name", "Model_1", "Model_2", "Model_3", "Model_4", "Serial_1", "Serial_2", "Serial_3", "Serial_4"];

      // Add parameters in one batch
      paramInstance.add(ZCRM.Record.Model.GetRecordsParam.FIELDS, fieldNames.toString());
      paramInstance.add(ZCRM.Record.Model.GetRecordsParam.PER_PAGE, 10);

      // Get records with the specified fields
      let response = await recordOperations.getRecords(paramInstance, new HeaderMap());

      if (!response || [204, 304].includes(response.getStatusCode())) {
        return [];
      }

      let responseObject = response.getObject();
      if (!responseObject) return [];

      if (responseObject instanceof ZCRM.Record.Model.ResponseWrapper) {
        let records = responseObject.getData();
        let validRecords = records
          .filter(record => {
            try {
              return record.getKeyValue('Deal_Name') && record.getId();
            } catch (error) {
              return false;
            }
          })
          .map(record => ({
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

        this.cachedDeals = validRecords;
        this.saveCacheToStorage(validRecords);
        return validRecords;
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
      let request = new ZCRM.Record.Model.BodyWrapper();
      let record = new ZCRM.Record.Model.Record();

      if (input != null) {
        Object.entries(input).forEach(([key, value]) => {
          record.addKeyValue(key, value);
        });
      }

      request.setData([record]);
      let response = await recordOperations.updateRecord(BigInt(recordId), request, new HeaderMap());

      if (response?.getStatusCode() === 200) {
        // Clear cache after successful update
        this.cachedDeals = null;
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
      }

      return response?.getObject()?.getData()?.[0];
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
  return await Records.initialize();
}

const ZohoCRMClient = {
  Deals: deals(),
  init: initialize
};

export const zohoSDK = {
  getDeals: async () => {
    // Ensure initialization is complete before getting deals
    await Records.initialize();
    return await ZohoCRMClient.Deals.get();
  },
  updateDeal: async (id, input) => {
    await Records.initialize();
    return await ZohoCRMClient.Deals.update(id, input);
  },
  init: ZohoCRMClient.init
};

export default ZohoCRMClient; 
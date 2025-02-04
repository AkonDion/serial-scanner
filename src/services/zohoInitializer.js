class SDKInitializer {
  static isInitialized = false;

  static async initializeSDK() {
    if (this.isInitialized) return;

    try {
      let logger = Logger.getInstance(Levels.ALL);
      let environment = DataCenter.US.PRODUCTION();

      // Determine the correct redirect URL based on the current domain
      const currentDomain = window.location.origin;
      const redirectURL = `${currentDomain}/redirect.html`;
      console.log('Using redirect URL:', redirectURL);

      let token = new OAuthBuilder()
        .clientId("1000.XEFCVRC8MNXTBILNL6VJ2GQC2F9NLV")
        .scope("ZohoCRM.modules.ALL,ZohoCRM.settings.ALL")
        .redirectURL(redirectURL)
        .build();

      let sdkConfig = new SDKConfigBuilder()
        .autoRefreshFields(false)
        .cacheStore(false)
        .pickListValidation(false)
        .build();

      await (new InitializeBuilder())
        .environment(environment)
        .token(token)
        .SDKConfig(sdkConfig)
        .logger(logger)
        .initialize();

      this.isInitialized = true;
      console.log('Zoho CRM SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Zoho CRM SDK:', error);
      throw error;
    }
  }

  static isSDKInitialized() {
    return this.isInitialized;
  }
}

export const initializeZohoSDK = SDKInitializer.initializeSDK.bind(SDKInitializer);
export const isSDKInitialized = SDKInitializer.isSDKInitialized.bind(SDKInitializer);
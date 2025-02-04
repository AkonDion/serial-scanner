// Note: This file is for documentation purposes only.
// The actual objects are provided by the Zoho SDK at runtime.

// Example of the shape of API responses:
/*
{
  data: [
    {
      id: "123",
      Deal_Name: "Example Deal",
      Model_1: "Model A",
      Model_2: "Model B",
      ...
    }
  ],
  info: {
    per_page: 10,
    count: 1,
    page: 1,
    more_records: false
  }
}
*/

// Example of a Deal object structure:
/*
{
  id: "123",
  Deal_Name: "Example Deal",
  Model_1: "Model A",
  Model_2: "Model B",
  Model_3: "Model C",
  Model_4: "Model D",
  Serial_1: "SN001",
  Serial_2: "SN002",
  Serial_3: "SN003",
  Serial_4: "SN004"
}
*/

// The Zoho SDK provides these global objects at runtime:
// - ZCRM: The main SDK object with Record operations
//   - Record.Operations: For CRUD operations
//   - Record.Model: Contains model classes like BodyWrapper, Record, etc.
//
// - ParameterMap: For adding query parameters
//   - add(name, value): Adds a parameter
//   - get(key): Gets a parameter value
//   - getParameterMap(): Gets all parameters
//
// - HeaderMap: For adding request headers
//   - add(name, value): Adds a header
//   - get(key): Gets a header value
//   - getHeaderMap(): Gets all headers
//
// - Choice: For handling picklist values
// - Logger: For SDK logging
// - Levels: Log levels (ALL, DEBUG, etc)
// - DataCenter: Available data centers (US, EU, etc)
// - OAuthBuilder: For OAuth configuration
// - SDKConfigBuilder: For SDK settings
// - InitializeBuilder: For SDK initialization
// TimeSeriesApiService.js
// Client service for interacting with the TimeSeries API

class TimeSeriesApiService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // Helper method for making API requests
  async fetchApi(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const config = {
      ...defaultOptions,
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      
      // For non-204 responses, parse the JSON
      if (response.status !== 204) {
        const data = await response.json();
        
        // Check if response is an error
        if (!response.ok) {
          throw new Error(data.error || 'Unknown error occurred');
        }
        
        return data;
      }
      
      return null; // For 204 No Content responses
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ===== Schema API Methods =====
  
  // Register a new schema
  async registerSchema(schema) {
    return this.fetchApi('/api/schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  }
  
  // Get all schemas
  async getSchemas() {
    return this.fetchApi('/api/schemas');
  }
  
  // Get schema by ID
  async getSchema(id) {
    return this.fetchApi(`/api/schemas/${id}`);
  }
  
  // Update schema
  async updateSchema(id, schema) {
    return this.fetchApi(`/api/schemas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schema),
    });
  }
  
  // Delete schema
  async deleteSchema(id) {
    return this.fetchApi(`/api/schemas/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== Mapping API Methods =====
  
  // Create a new mapping
  async createMapping(mapping) {
    return this.fetchApi('/api/mappings', {
      method: 'POST',
      body: JSON.stringify(mapping),
    });
  }
  
  // Get all mappings
  async getMappings(schemaId = null) {
    const queryParams = schemaId ? `?schemaId=${schemaId}` : '';
    return this.fetchApi(`/api/mappings${queryParams}`);
  }
  
  // Get mapping by ID
  async getMapping(id) {
    return this.fetchApi(`/api/mappings/${id}`);
  }
  
  // Update mapping
  async updateMapping(id, mapping) {
    return this.fetchApi(`/api/mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapping),
    });
  }
  
  // Delete mapping
  async deleteMapping(id) {
    return this.fetchApi(`/api/mappings/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== Query API Methods =====
  
  // Query time-series data
  async queryTimeSeries(queryParams) {
    return this.fetchApi('/api/timeseries/query', {
      method: 'POST',
      body: JSON.stringify(queryParams),
    });
  }
  
  // Get available dimensions for a mapping
  async getTimeSeriesDimensions(mappingId) {
    return this.fetchApi(`/api/timeseries/dimensions?mappingId=${mappingId}`);
  }

  // ===== Data Access Methods =====
  
  // Get schema data
  async getSchemaData(schemaId) {
    return this.fetchApi(`/api/data/${schemaId}`);
  }

  // ===== Utility Methods =====
  
  // Generate time points between two dates
  generateTimePoints(startDate, endDate, granularity = 'day') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timePoints = [];
    
    let current = new Date(start);
    
    while (current <= end) {
      timePoints.push(new Date(current));
      
      // Increment based on granularity
      switch (granularity) {
        case 'minute':
          current.setMinutes(current.getMinutes() + 1);
          break;
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }
    
    return timePoints;
  }
  
  // Parse a date in YYYY-MM-DD format
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  
  // Transform timeseries response into a format suitable for charts
  transformTimeSeriesForChart(timeseriesResponse, dimensionFilter = null) {
    if (!timeseriesResponse || !timeseriesResponse.timeseries) {
      return [];
    }
    
    const { timeseries, metadata } = timeseriesResponse;
    
    // Create a chart-friendly data structure
    const chartData = timeseries.map(timePoint => {
      const dataPoint = {
        date: timePoint.time,
      };
      
      // Process each data point
      timePoint.points.forEach(point => {
        // Skip points that don't match the dimension filter
        if (dimensionFilter) {
          const match = Object.entries(dimensionFilter).every(([dimName, dimValue]) => {
            return point.dimensions[dimName] === dimValue;
          });
          
          if (!match) return;
        }
        
        // Create a key based on dimension values
        const dimensionKey = Object.entries(point.dimensions)
          .map(([dimName, dimValue]) => {
            // Look up the display name from metadata
            const dimension = metadata.dimensions.find(d => d.name === dimName);
            if (!dimension) return dimValue;
            
            const dimValueObj = dimension.values.find(v => v.id === dimValue);
            return dimValueObj ? dimValueObj.name : dimValue;
          })
          .join(' - ');
        
        // Add metrics to the data point
        Object.entries(point.metrics).forEach(([metricName, metricValue]) => {
          dataPoint[`${dimensionKey} (${metricName})`] = metricValue;
        });
      });
      
      return dataPoint;
    });
    
    return chartData;
  }
  
  // Get series from transformed chart data
  getChartSeries(chartData) {
    if (!chartData || chartData.length === 0) return [];
    
    // Get all keys except 'date'
    return Object.keys(chartData[0]).filter(key => key !== 'date');
  }
}

// Export the service
export default TimeSeriesApiService;

const fs = require('fs');
const csvParser = require('csv-parser');

/**
 * Parse a CSV file and extract recipients data
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of recipient objects
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .on('error', (error) => {
        reject(new Error(`Error reading CSV file: ${error.message}`));
      })
      .pipe(csvParser())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        // Validate that the CSV has at least required fields (email field)
        if (results.length > 0 && !results[0].email) {
          return reject(new Error('CSV file must contain an "email" column'));
        }
        resolve(results);
      })
      .on('error', (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      });
  });
};

/**
 * Extract field names from the first row of the CSV
 * @param {string} filePath - Path to the CSV file 
 * @returns {Promise<Array>} - Array of field names
 */
const extractFieldNames = (filePath) => {
  return new Promise((resolve, reject) => {
    let headerProcessed = false;
    let fieldNames = [];
    
    fs.createReadStream(filePath)
      .on('error', (error) => {
        reject(new Error(`Error reading CSV file: ${error.message}`));
      })
      .pipe(csvParser())
      .on('headers', (headers) => {
        fieldNames = headers;
        headerProcessed = true;
        resolve(fieldNames);
      })
      .on('data', () => {
        // Stop reading after first row
        if (headerProcessed) {
          resolve(fieldNames);
        }
      })
      .on('end', () => {
        if (!headerProcessed) {
          reject(new Error('No headers found in CSV file'));
        }
      })
      .on('error', (error) => {
        reject(new Error(`Error parsing CSV headers: ${error.message}`));
      });
  });
};

module.exports = {
  parseCSV,
  extractFieldNames
};
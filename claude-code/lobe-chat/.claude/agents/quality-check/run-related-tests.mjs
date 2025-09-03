#!/usr/bin/env node
import { spawn } from 'child_process';
import { constants } from 'fs';
import { access } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';

/**
 * Determine which package a file belongs to
 * @param {string} filePath - File path relative to project root
 * @returns {string} Package identifier ('root' or package name)
 */
function getFilePackage(filePath) {
  // Convert to relative path from project root if needed
  const relativePath = relative(process.cwd(), filePath);
  
  // Check if file is in packages directory
  if (relativePath.startsWith('packages/')) {
    const segments = relativePath.split('/');
    if (segments.length >= 2) {
      return segments[1]; // Return package name (e.g., 'database', 'model-runtime')
    }
  }
  
  return 'root';
}

/**
 * Find test files for modified source files
 * @param {string[]} modifiedFiles - Array of modified file paths
 * @returns {Promise<Map<string, string[]>>} Map of package name to test file paths
 */
async function findTestFiles(modifiedFiles) {
  const testFilesByPackage = new Map();

  for (const file of modifiedFiles) {
    try {
      await access(file, constants.F_OK);
    } catch {
      continue; // Skip non-existent files
    }

    const dir = dirname(file);
    const baseName = basename(file).replace(/\.[^.]*$/, '');
    const packageName = getFilePackage(file);

    // Only precise location-based search
    const preciseSearchPaths = [
      join(dir, `${baseName}.test.ts`),
      join(dir, `${baseName}.test.tsx`),
      join(dir, '__tests__', `${baseName}.test.ts`),
      join(dir, '__tests__', `${baseName}.test.tsx`),
    ];

    for (const testPath of preciseSearchPaths) {
      try {
        await access(testPath, constants.F_OK);
        
        if (!testFilesByPackage.has(packageName)) {
          testFilesByPackage.set(packageName, new Set());
        }
        testFilesByPackage.get(packageName).add(testPath);
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  // Convert Sets to sorted Arrays
  const result = new Map();
  for (const [packageName, testFiles] of testFilesByPackage) {
    result.set(packageName, Array.from(testFiles).sort());
  }

  return result;
}

/**
 * Run tests for a single package
 * @param {string} packageName - Package name ('root' or actual package name)
 * @param {string[]} testFiles - Array of test file paths to run
 * @returns {Promise<{success: boolean, output: string, packageName: string}>} Test result
 */
async function runPackageTests(packageName, testFiles) {
  if (testFiles.length === 0) {
    return {
      success: true,
      output: `No test files found for package '${packageName}'`,
      packageName,
    };
  }

  return new Promise(async (resolve) => {
    const cwd = packageName === 'root' ? process.cwd() : join(process.cwd(), 'packages', packageName);
    
    // Detect vitest config file
    let configFile = 'vitest.config.ts';
    const configOptions = ['vitest.config.mts', 'vitest.config.ts', 'vitest.config.js'];
    
    for (const config of configOptions) {
      try {
        await access(join(cwd, config), constants.F_OK);
        configFile = config;
        break;
      } catch {
        // Continue to next config option
      }
    }
    
    // Convert absolute paths to relative paths for the package
    const relativeTestFiles = testFiles.map(testFile => {
      if (packageName === 'root') {
        return relative(cwd, testFile);
      } else {
        // For package tests, make paths relative to package directory
        const packageRoot = join(process.cwd(), 'packages', packageName);
        return relative(packageRoot, testFile);
      }
    });
    
    const vitestArgs = [
      'vitest',
      'run',
      '--config',
      configFile,
      '--silent=passed-only',
      ...relativeTestFiles,
    ];
    
    let output = '';
    
    const child = spawn('bunx', vitestArgs, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output.trim(),
        packageName,
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        output: `Failed to run tests: ${error.message}`,
        packageName,
      });
    });
  });
}

/**
 * Run tests for all packages in parallel and collect outputs
 * @param {Map<string, string[]>} testFilesByPackage - Map of package name to test file paths
 * @returns {Promise<{success: boolean, results: Array}>} Test results
 */
async function runTests(testFilesByPackage) {
  if (testFilesByPackage.size === 0) {
    console.log('No test files found');
    return { success: true, results: [] };
  }

  console.log(`Running tests for ${testFilesByPackage.size} package(s):`);
  for (const [packageName, testFiles] of testFilesByPackage) {
    console.log(`  • ${packageName}: ${testFiles.length} test file(s)`);
  }
  console.log('');

  // Run tests in parallel
  const testPromises = [];
  for (const [packageName, testFiles] of testFilesByPackage) {
    testPromises.push(runPackageTests(packageName, testFiles));
  }

  const results = await Promise.all(testPromises);
  const overallSuccess = results.every((result) => result.success);

  return { success: overallSuccess, results };
}

/**
 * Display test results in a structured format
 * @param {{success: boolean, results: Array}} testResults - Test results from runTests
 */
function displayResults(testResults) {
  const { success, results } = testResults;
  
  if (results.length === 0) {
    return;
  }
  
  console.log('='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const { success: packageSuccess, output, packageName } = result;
    const statusIcon = packageSuccess ? '✅' : '❌';
    const statusText = packageSuccess ? 'PASSED' : 'FAILED';
    
    console.log(`\n${statusIcon} Package: ${packageName} - ${statusText}`);
    console.log('-'.repeat(40));
    
    if (output) {
      console.log(output);
    } else {
      console.log('No output');
    }
    
    if (result !== results[results.length - 1]) {
      console.log(''); // Add spacing between packages
    }
  }
  
  console.log('\n' + '='.repeat(60));
  const overallIcon = success ? '✅' : '❌';
  const overallStatus = success ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
  console.log(`${overallIcon} Overall Result: ${overallStatus}`);
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node testing.js <file1> <file2> ...');
    process.exit(1);
  }

  try {
    const testFilesByPackage = await findTestFiles(args);
    const testResults = await runTests(testFilesByPackage);
    displayResults(testResults);
    process.exit(testResults.success ? 0 : 1);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

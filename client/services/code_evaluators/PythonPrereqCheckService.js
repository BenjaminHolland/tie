// Copyright 2017 The TIE Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for performing pre-requisite checks on Python code
 * snippets.
 */

tie.factory('PythonPrereqCheckService', [
  'CodePrereqCheckResultObjectFactory', 'PrereqCheckFailureObjectFactory',
  'PREREQ_CHECK_TYPE_BAD_IMPORT', 'PREREQ_CHECK_TYPE_MISSING_STARTER_CODE',
  'SUPPORTED_PYTHON_LIBS',
  function(
      CodePrereqCheckResultObjectFactory, PrereqCheckFailureObjectFactory,
      PREREQ_CHECK_TYPE_BAD_IMPORT, PREREQ_CHECK_TYPE_MISSING_STARTER_CODE,
      SUPPORTED_PYTHON_LIBS) {

    var rightTrim = function(str) {
      // Remove trailing white space at end of string.
      var RIGHT_TRIM_PATTERN = /\s+$/;
      return str.replace(RIGHT_TRIM_PATTERN, '');
    };

    var extractTopLevelFunctionLines = function(starterCode) {
      var starterCodeLines = starterCode.split('\n');
      var topLevelFunctionLines = [];
      for (var i = 0; i < starterCodeLines.length; i++) {
        var line = rightTrim(starterCodeLines[i]);
        if (line.startsWith('def ')) {
          topLevelFunctionLines.push(line);
        }
      }
      return topLevelFunctionLines;
    };

    var doTopLevelFunctionLinesExist = function(
      code, expectedTopLevelFunctionLines) {
        var codeLines = code.split('\n');
        for (var i = 0; i < codeLines.length; i++) {
          codeLines[i] = rightTrim(codeLines[i]);
        }

        return expectedTopLevelFunctionLines.every(function(expectedLine) {
          return codeLines.indexOf(expectedLine) !== -1;
        });
    };

    var checkStarterCodeFunctionsPresent = function(starterCode, code) {
      var expectedTopLevelFunctionLines = extractTopLevelFunctionLines(
        starterCode);
      return doTopLevelFunctionLinesExist(code, expectedTopLevelFunctionLines);
    };

    var getImportedLibraries = function(code) {
      var codeLines = code.split('\n');
      var importedLibraries = [];
      var importPattern = new RegExp('^import\\ (\\w+)$');
      for (var i = 0; i < codeLines.length; i++) {
        var match =  importPattern.exec(codeLines[i]);
        if (match) {
          importedLibraries.push(match[1]);
        }
      }
      return importedLibraries;
    };

    var getUnsupportedImports = function(importedLibraries) {
      var unsupportedImports = importedLibraries.filter(function(
        importedLibrary) {
          return SUPPORTED_PYTHON_LIBS.indexOf(importedLibrary) === -1;
        }
      );
      return unsupportedImports;
    };

    return {
      // Returns a promise.
      checkCode: function(starterCode, code) {
        // Check that starter code is present.
        if (!(checkStarterCodeFunctionsPresent(starterCode, code))) {
          var prereqCheckFailures = [];
          prereqCheckFailures.push(
            PrereqCheckFailureObjectFactory.create(
              PREREQ_CHECK_TYPE_MISSING_STARTER_CODE, null, starterCode));
          return Promise.resolve(
            CodePrereqCheckResultObjectFactory.create(
              prereqCheckFailures));
        }

        // Verify no unsupported libraries are imported.
        var importedLibraries = getImportedLibraries(code);
        var unsupportedImports = getUnsupportedImports(importedLibraries);
        if (unsupportedImports.length > 0) {
          var prereqCheckFailures = [];
          prereqCheckFailures.push(
            PrereqCheckFailureObjectFactory.create(
              PREREQ_CHECK_TYPE_BAD_IMPORT, unsupportedImports, null));
            return Promise.resolve(
              CodePrereqCheckResultObjectFactory.create(
                prereqCheckFailures));
        }

        // Otherwise, code passed all pre-requisite checks.
        return Promise.resolve(
          CodePrereqCheckResultObjectFactory.create(
          []));
      },
      checkStarterCodeFunctionsPresent: checkStarterCodeFunctionsPresent,
      doTopLevelFunctionLinesExist: doTopLevelFunctionLinesExist,
      extractTopLevelFunctionLines: extractTopLevelFunctionLines,
      getImportedLibraries: getImportedLibraries,
      getUnsupportedImports: getUnsupportedImports
    };
  }
]);

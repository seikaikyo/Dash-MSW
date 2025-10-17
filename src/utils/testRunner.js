/**
 * 測試執行引擎
 * 提供測試劇本執行、斷言、報告功能
 */

export class TestRunner {
  constructor() {
    this.tests = [];
    this.scenarios = [];
    this.results = [];
    this.currentTest = null;
    this.beforeEachFn = null;
    this.afterEachFn = null;
  }

  /**
   * 註冊測試案例
   */
  test(name, fn) {
    this.tests.push({ name, fn, type: 'test' });
  }

  /**
   * 註冊測試劇本
   */
  scenario(name, fn) {
    this.scenarios.push({ name, fn, type: 'scenario' });
  }

  /**
   * 每個測試前執行
   */
  beforeEach(fn) {
    this.beforeEachFn = fn;
  }

  /**
   * 每個測試後執行
   */
  afterEach(fn) {
    this.afterEachFn = fn;
  }

  /**
   * 執行所有測試
   */
  async runAll() {
    this.results = [];
    const allTests = [...this.tests, ...this.scenarios];

    for (const test of allTests) {
      await this.runTest(test);
    }

    return this.getReport();
  }

  /**
   * 執行單個測試
   */
  async runTest(test) {
    this.currentTest = test;
    const startTime = Date.now();
    const result = {
      name: test.name,
      type: test.type,
      status: 'pending',
      duration: 0,
      assertions: [],
      errors: [],
      logs: []
    };

    try {
      // 執行 beforeEach
      if (this.beforeEachFn) {
        await this.beforeEachFn();
      }

      // 執行測試
      await test.fn(this.createAssertContext(result));

      // 執行 afterEach
      if (this.afterEachFn) {
        await this.afterEachFn();
      }

      // 檢查是否所有斷言都通過
      const failedAssertions = result.assertions.filter(a => !a.passed);
      if (failedAssertions.length > 0) {
        result.status = 'failed';
        result.errors.push(`${failedAssertions.length} 個斷言失敗`);
      } else {
        result.status = 'passed';
      }
    } catch (error) {
      result.status = 'error';
      result.errors.push(error.message);
      console.error(`測試錯誤 [${test.name}]:`, error);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);
    this.currentTest = null;

    return result;
  }

  /**
   * 創建斷言上下文
   */
  createAssertContext(result) {
    return {
      // 基本斷言
      assert: (condition, message) => {
        const assertion = {
          type: 'assert',
          passed: !!condition,
          message: message || 'Assertion failed',
          actual: condition
        };
        result.assertions.push(assertion);
        if (!assertion.passed) {
          throw new Error(assertion.message);
        }
      },

      // 相等斷言
      assertEqual: (actual, expected, message) => {
        const passed = actual === expected;
        const assertion = {
          type: 'assertEqual',
          passed,
          message: message || `Expected ${expected}, got ${actual}`,
          actual,
          expected
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 深度相等斷言
      assertDeepEqual: (actual, expected, message) => {
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        const assertion = {
          type: 'assertDeepEqual',
          passed,
          message: message || 'Deep equality failed',
          actual,
          expected
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 包含斷言
      assertContains: (actual, expected, message) => {
        const passed = actual && actual.includes(expected);
        const assertion = {
          type: 'assertContains',
          passed,
          message: message || `Expected to contain ${expected}`,
          actual,
          expected
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 類型斷言
      assertType: (actual, expectedType, message) => {
        const actualType = typeof actual;
        const passed = actualType === expectedType;
        const assertion = {
          type: 'assertType',
          passed,
          message: message || `Expected type ${expectedType}, got ${actualType}`,
          actual: actualType,
          expected: expectedType
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 陣列長度斷言
      assertLength: (actual, expectedLength, message) => {
        const actualLength = actual ? actual.length : 0;
        const passed = actualLength === expectedLength;
        const assertion = {
          type: 'assertLength',
          passed,
          message: message || `Expected length ${expectedLength}, got ${actualLength}`,
          actual: actualLength,
          expected: expectedLength
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 異常斷言
      assertThrows: async (fn, message) => {
        let thrown = false;
        let error = null;
        try {
          await fn();
        } catch (e) {
          thrown = true;
          error = e;
        }
        const assertion = {
          type: 'assertThrows',
          passed: thrown,
          message: message || 'Expected to throw an error',
          actual: error?.message || 'No error thrown'
        };
        result.assertions.push(assertion);
        if (!thrown) {
          throw new Error(assertion.message);
        }
      },

      // 真值斷言
      assertTrue: (actual, message) => {
        const passed = actual === true;
        const assertion = {
          type: 'assertTrue',
          passed,
          message: message || `Expected true, got ${actual}`,
          actual
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 假值斷言
      assertFalse: (actual, message) => {
        const passed = actual === false;
        const assertion = {
          type: 'assertFalse',
          passed,
          message: message || `Expected false, got ${actual}`,
          actual
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // Null 斷言
      assertNull: (actual, message) => {
        const passed = actual === null;
        const assertion = {
          type: 'assertNull',
          passed,
          message: message || `Expected null, got ${actual}`,
          actual
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 非 Null 斷言
      assertNotNull: (actual, message) => {
        const passed = actual !== null && actual !== undefined;
        const assertion = {
          type: 'assertNotNull',
          passed,
          message: message || 'Expected not null',
          actual
        };
        result.assertions.push(assertion);
        if (!passed) {
          throw new Error(assertion.message);
        }
      },

      // 記錄日誌
      log: (message) => {
        result.logs.push({
          timestamp: Date.now(),
          message
        });
        console.log(`[測試日誌] ${message}`);
      },

      // 等待
      wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
    };
  }

  /**
   * 取得測試報告
   */
  getReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    const totalAssertions = this.results.reduce((sum, r) => sum + r.assertions.length, 0);
    const passedAssertions = this.results.reduce(
      (sum, r) => sum + r.assertions.filter(a => a.passed).length,
      0
    );

    return {
      summary: {
        total,
        passed,
        failed,
        errors,
        duration,
        passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
        totalAssertions,
        passedAssertions,
        assertionPassRate: totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(2) : 0
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清除所有測試
   */
  clear() {
    this.tests = [];
    this.scenarios = [];
    this.results = [];
  }
}

// 全域測試執行器實例
export const testRunner = new TestRunner();

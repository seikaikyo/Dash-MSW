/**
 * Webhook 簽名驗證工具
 * 支援多種常見的 webhook 簽名機制
 */

/**
 * 計算 HMAC-SHA256 簽名（瀏覽器環境）
 * @param {string} secret - 簽名密鑰
 * @param {string} payload - 要簽名的數據（JSON 字串）
 * @returns {Promise<string>} - Base64 編碼的簽名
 */
export async function generateHmacSha256Signature(secret, payload) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  // 導入密鑰
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 生成簽名
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // 轉換為十六進制字串
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * 計算 SHA256 哈希值
 * @param {string} data - 要哈希的數據
 * @returns {Promise<string>} - 十六進制哈希值
 */
export async function generateSha256Hash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 驗證 GitHub 風格的 webhook 簽名
 * 格式：sha256=<signature>
 * @param {string} payload - Webhook payload（JSON 字串）
 * @param {string} signature - 接收到的簽名（含 sha256= 前綴）
 * @param {string} secret - 配置的密鑰
 * @returns {Promise<boolean>}
 */
export async function verifyGitHubSignature(payload, signature, secret) {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const receivedSignature = signature.substring(7); // 移除 'sha256=' 前綴
  const expectedSignature = await generateHmacSha256Signature(secret, payload);

  return timingSafeEqual(receivedSignature, expectedSignature);
}

/**
 * 驗證 Stripe 風格的 webhook 簽名
 * 格式：t=timestamp,v1=signature
 * @param {string} payload - Webhook payload（JSON 字串）
 * @param {string} signatureHeader - Stripe-Signature header 值
 * @param {string} secret - Webhook 密鑰
 * @param {number} tolerance - 時間容差（秒），預設 300 秒
 * @returns {Promise<boolean>}
 */
export async function verifyStripeSignature(payload, signatureHeader, secret, tolerance = 300) {
  if (!signatureHeader) {
    return false;
  }

  // 解析簽名頭
  const parts = signatureHeader.split(',');
  const parsedHeader = {};

  parts.forEach(part => {
    const [key, value] = part.split('=');
    parsedHeader[key] = value;
  });

  const timestamp = parsedHeader.t;
  const signatures = [parsedHeader.v1, parsedHeader.v0].filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // 檢查時間戳是否在容差範圍內
  const currentTime = Math.floor(Date.now() / 1000);
  const timestampAge = currentTime - parseInt(timestamp);

  if (timestampAge > tolerance) {
    console.warn('Webhook timestamp too old');
    return false;
  }

  // 構建簽名字串
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = await generateHmacSha256Signature(secret, signedPayload);

  // 檢查是否有任何簽名匹配
  return signatures.some(sig => timingSafeEqual(sig, expectedSignature));
}

/**
 * 驗證簡單的 HMAC-SHA256 簽名
 * @param {string} payload - Webhook payload（JSON 字串）
 * @param {string} signature - 接收到的簽名
 * @param {string} secret - 密鑰
 * @returns {Promise<boolean>}
 */
export async function verifyHmacSignature(payload, signature, secret) {
  if (!signature) {
    return false;
  }

  const expectedSignature = await generateHmacSha256Signature(secret, payload);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * 驗證 SHA256 哈希值（用於簡單的完整性檢查）
 * @param {string} payload - 數據
 * @param {string} hash - 接收到的哈希值
 * @returns {Promise<boolean>}
 */
export async function verifySha256Hash(payload, hash) {
  if (!hash) {
    return false;
  }

  const expectedHash = await generateSha256Hash(payload);
  return timingSafeEqual(hash, expectedHash);
}

/**
 * 時間安全的字串比較（防止時序攻擊）
 * @param {string} a - 字串 A
 * @param {string} b - 字串 B
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 通用 Webhook 簽名驗證器
 * 支援多種簽名格式
 */
export class WebhookSignatureVerifier {
  /**
   * @param {string} secret - Webhook 密鑰
   * @param {string} signatureType - 簽名類型：'github', 'stripe', 'hmac', 'sha256'
   */
  constructor(secret, signatureType = 'hmac') {
    this.secret = secret;
    this.signatureType = signatureType.toLowerCase();
  }

  /**
   * 驗證 webhook 簽名
   * @param {string} payload - Webhook payload（JSON 字串）
   * @param {string} signature - 簽名值（從 header 或 body 中取得）
   * @param {Object} options - 額外選項（如 tolerance）
   * @returns {Promise<Object>} - { valid: boolean, error?: string }
   */
  async verify(payload, signature, options = {}) {
    if (!this.secret) {
      return {
        valid: false,
        error: '未設定 webhook 密鑰'
      };
    }

    if (!signature) {
      return {
        valid: false,
        error: '缺少簽名'
      };
    }

    try {
      let isValid = false;

      switch (this.signatureType) {
        case 'github':
          isValid = await verifyGitHubSignature(payload, signature, this.secret);
          break;

        case 'stripe':
          isValid = await verifyStripeSignature(
            payload,
            signature,
            this.secret,
            options.tolerance
          );
          break;

        case 'sha256':
          isValid = await verifySha256Hash(payload, signature);
          break;

        case 'hmac':
        default:
          isValid = await verifyHmacSignature(payload, signature, this.secret);
          break;
      }

      if (!isValid) {
        return {
          valid: false,
          error: '簽名驗證失敗'
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: '簽名驗證過程發生錯誤：' + error.message
      };
    }
  }

  /**
   * 為 payload 生成簽名（用於測試或發送 webhook）
   * @param {string} payload - 要簽名的數據
   * @returns {Promise<string>}
   */
  async sign(payload) {
    switch (this.signatureType) {
      case 'github':
        const githubSig = await generateHmacSha256Signature(this.secret, payload);
        return `sha256=${githubSig}`;

      case 'stripe':
        const timestamp = Math.floor(Date.now() / 1000);
        const signedPayload = `${timestamp}.${payload}`;
        const stripeSig = await generateHmacSha256Signature(this.secret, signedPayload);
        return `t=${timestamp},v1=${stripeSig}`;

      case 'sha256':
        return await generateSha256Hash(payload);

      case 'hmac':
      default:
        return await generateHmacSha256Signature(this.secret, payload);
    }
  }
}

/**
 * 從 HTTP headers 中提取簽名
 * @param {Object} headers - HTTP headers 對象
 * @param {string} signatureType - 簽名類型
 * @returns {string|null}
 */
export function extractSignatureFromHeaders(headers, signatureType = 'hmac') {
  const headerMap = {
    'github': 'x-hub-signature-256',
    'stripe': 'stripe-signature',
    'hmac': 'x-webhook-signature',
    'sha256': 'x-webhook-hash'
  };

  const headerName = headerMap[signatureType.toLowerCase()] || 'x-webhook-signature';

  // 嘗試不同的大小寫變體
  return headers[headerName] ||
         headers[headerName.toLowerCase()] ||
         headers[headerName.toUpperCase()] ||
         null;
}

// 运行时配置管理
// 解决 Docker 容器中环境变量在运行时提供的问题

export interface RuntimeConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  deepseek: {
    apiKey: string;
  };
  xfyun: {
    appId: string;
    apiKey: string;
    apiSecret: string;
  };
  amap: {
    key: string;
    webServiceKey: string;
    secret?: string;
  };
}

let runtimeConfig: RuntimeConfig | null = null;

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  try {
    // 尝试从 API 端点获取配置
    const response = await fetch('/api/config');
    if (response.ok) {
      runtimeConfig = await response.json();
      return runtimeConfig;
    }
  } catch (error) {
    console.warn('无法从 API 获取配置，使用环境变量');
  }

  // 回退到环境变量（构建时可用的）
  runtimeConfig = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
    },
    xfyun: {
      appId: process.env.NEXT_PUBLIC_XFYUN_APP_ID || '',
      apiKey: process.env.NEXT_PUBLIC_XFYUN_API_KEY || '',
      apiSecret: process.env.NEXT_PUBLIC_XFYUN_API_SECRET || '',
    },
    amap: {
      key: process.env.NEXT_PUBLIC_AMAP_KEY || '',
      webServiceKey: process.env.AMAP_WEB_SERVICE_KEY || '',
      secret: process.env.NEXT_PUBLIC_AMAP_SECRET || '',
    },
  };

  return runtimeConfig;
}

export function validateConfig(config: RuntimeConfig): string[] {
  const errors: string[] = [];

  if (!config.supabase.url) {
    errors.push('Supabase URL 未配置');
  }
  if (!config.supabase.anonKey) {
    errors.push('Supabase Anon Key 未配置');
  }
  if (!config.deepseek.apiKey) {
    errors.push('DeepSeek API Key 未配置');
  }
  if (!config.xfyun.appId) {
    errors.push('科大讯飞 App ID 未配置');
  }
  if (!config.xfyun.apiKey) {
    errors.push('科大讯飞 API Key 未配置');
  }
  if (!config.xfyun.apiSecret) {
    errors.push('科大讯飞 API Secret 未配置');
  }
  if (!config.amap.key) {
    errors.push('高德地图 JS API Key 未配置');
  }
  if (!config.amap.webServiceKey) {
    errors.push('高德地图 Web服务 Key 未配置');
  }

  return errors;
}

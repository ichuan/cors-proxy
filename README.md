# **Simple CORS Proxy Server**

这是一个基于 Node.js 的轻量级 HTTP 代理服务器，旨在解决前端开发过程中的跨域资源共享 (CORS) 问题。

它通过在本地启动一个中间层服务器，拦截浏览器的请求并转发给目标服务器，同时自动处理所有 CORS 相关的响应头（Access-Control-Allow-Origin 等），从而绕过浏览器的同源策略限制。

## **主要功能**

* **自动 CORS 处理**：自动拦截 OPTIONS 预检请求并返回成功状态；将请求来源 (Origin) 动态反射到响应头中。  
* **凭证支持**：支持携带 Cookie 和认证信息的请求 (Access-Control-Allow-Credentials: true)。  
* **Host 头重写**：自动修改请求头中的 Host 字段，确保能成功代理到虚拟主机或 CDN 后端的 API。  
* **请求日志**：实时在控制台输出请求的时间、方法和 URL，便于调试。  
* **灵活配置**：支持通过命令行参数指定目标 URL 和本地监听端口。

## **环境要求**

* Node.js (建议 v12.0 或更高版本)

## **安装**

本项目已包含配置文件 package.json。请在项目根目录下直接运行以下命令以安装所需依赖（包括 http-proxy）：

```
npm install
```

## **使用方法**

### **命令行启动**

基本语法：

```
node proxy.js \<目标URL\> \[本地端口\]
```

#### **示例 1：基本用法**

将本地 8010 端口（默认）的请求转发到 http://api.example.com：

```
node proxy.js http://api.example.com
```

#### **示例 2：指定端口**

将本地 9000 端口的请求转发到 https://api.github.com：

```
node proxy.js https://api.github.com 9000
```

### **前端调用示例**

假设你启动了代理指向 http://api.example.com，并且本地监听在 8010。

**之前 (跨域报错):**

```
fetch('http://api.example.com/users/1');
```

**之后 (通过代理):**

```
// 请求本地代理地址，路径保持一致  
fetch('http://localhost:8010/users/1');
```

## **注意事项**

1. **HTTPS 目标**：本工具支持转发请求到 HTTPS 目标地址（例如 https://google.com），但本地服务依然是 HTTP。这对于本地开发通常是足够的。  
2. **安全性**：此代理服务器通过反射 Origin 头来允许所有来源的跨域请求。请仅在**开发环境**或受信任的内部网络中使用，不要将其部署到生产环境的公共网络中，否则可能导致安全风险。  
3. **错误处理**：如果目标服务器宕机或拒绝连接，代理服务器会在控制台输出错误日志，并向客户端返回 500 错误，而不会导致进程崩溃。

import { handleRequest } from './handlers/requestHandler.js';

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};
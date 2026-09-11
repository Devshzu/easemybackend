export class HealthService {
  static getHealthStatus() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage()
    };
  }
}

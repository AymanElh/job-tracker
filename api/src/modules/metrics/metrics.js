const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'jobtrackr_' });

const httpRequestTotal = new client.Counter({
  name: 'jobtrackr_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpDuration = new client.Histogram({
  name: 'jobtrackr_http_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

const metricsMiddleware = (req, res, next) => {
  if (req.path === '/api/v1/metrics') return next();

  const start = Date.now();
  res.on('finish', () => {
    const labels = {
      method:      req.method,
      route:       req.route?.path || req.path,
      status_code: res.statusCode
    };
    httpRequestTotal.inc(labels);
    httpDuration.observe(labels, (Date.now() - start) / 1000);
  });
  next();
};

const metricsHandler = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = { metricsMiddleware, metricsHandler };
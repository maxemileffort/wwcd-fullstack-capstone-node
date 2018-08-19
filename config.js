'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://user123:user123@ds125862.mlab.com:25862/dfs-analytics-react-capstone';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://user123:user123@ds125862.mlab.com:25862/dfs-analytics-react-capstone';
exports.PORT = process.env.PORT || 8080;
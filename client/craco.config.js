const path = require('path');

module.exports = {
    devServer: {
        writeToDisk: true,
    },
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            paths.appBuild = webpackConfig.output.path = path.resolve('../wagtail_turbo/static/wagtail_turbo');
            webpackConfig.output.publicPath = "/static/wagtail_turbo/"
            return webpackConfig;
        }
    }
};

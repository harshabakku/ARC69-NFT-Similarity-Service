require('log-timestamp');
const client = require('./connection');


const pingElasticsearch = async () => {
    console.log("ping Elasticsearch")
    await client.ping(
        function(error,res) {
            if (error) {
                console.error('elasticsearch cluster is down!');
            } else {
                console.log('Elasticsearch Ready');
            }
        }
    );
}


module.exports = {
    pingElasticsearch
}

### AlgoSeas-NFT-Similarity-Service

The objective is to be able to facilitate similarity service for any ARC69 NFT collection available on AlgoSeas Marketplace.

#### Setup  Instructions:

--------------------------------

#### ElasticSearch Setup:

Install elasticsearch using docker, 

```sh
 sudo docker pull docker.elastic.co/elasticsearch/elasticsearch:8.4.3

 sudo docker run --name elasticsearch --net elastic -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node"  -e "xpack.security.enabled=false" -t docker.elastic.co/elasticsearch/elasticsearch:8.4.3
```

You can also choose to setup a free online server here.. https://cloud.elastic.co/registration  and then update elasticSearchServerURL in config.js

-------------------

#### Similarity Service Server Setup:

```sh
 git clone https://github.com/harshabakku/ARC69-NFT-Similarity-Service.git

 cd ARC69-NFT-Similarity-Service
 npm install
 npm run server 
 or
 npm start 
 ```

 The above commands should start the server on port 8443 and start indexing and periodically maintaining full Collection Data (All Assets, Listings, Sales ) of **config.defaultCollection** ('AlgoSeas Pirates')

Indexed data stats can be seen here.. 

>http://localhost:9200/_cat/indices?v=true       //docker setup in local

>https://{ElasticsearchServer}/_cat/indices?v=true   //if using elasticsearch cloud

Sample data can be seen here. 

>http://localhost:9200/algoseaspirates/_search?pretty=true&q=*:*&size=100

-------------------------

#### Testing Similarity Service: 
The code builds/generates similarity and function score elastisearch queries, executes and returns givenNFT, similarListingsNFTs, similarSaleNFTs, similarNFTs(most similar amongst all Assets) along with the score for every Asset/NFT. 

>curl -X GET httpsApiServer/api/similarityService/similarNFTs?limit=50&assetId={assetid}&collectionName={collectionName}


>Eg: http://localhost:8443/api/similarityService/similarNFTs?limit=50&assetId=20393&collectionName=AlgoSeas%20Pirates


Use ***explainScoring=true*** option to explain the elasticsearch score computation for the generated similarity/function_score queries for every single Asset/NFT returned.

>http://localhost:8443/api/similarityService/similarNFTs?limit=10&assetId=20393&collectionName=AlgoSeas%20Pirates&explainScoring=true


------------------------

#### Index Full Collection Data For Any Collection

For any collection index full data (Assets, Listings, Sales) via POST API call

> curl -X POST httpsApiServer/api/similarityService/indexFullCollection    -H "Content-Type: application/json"   -d '{"collectionName" : ${collectionName}}' 


Eg: pretty prints json response with json_pp
> curl -X POST http://localhost:8443/api/similarityService/indexFullCollection    -H "Content-Type: application/json"   -d '{"collectionName" : "Crazy Goose Flock"}' | json_pp

> curl -X POST http://localhost:8443/api/similarityService/indexFullCollection    -H "Content-Type: application/json"   -d '{"collectionName" : "Totally Average Cats"}' | json_pp


 
 Indexed data stats can be seen here... 


> http://localhost:9200/_cat/indices?v=true    //docker setup in local

>https://{ElasticsearchServer}/_cat/indices?v=true   //if using elasticsearch cloud

Sample data can be seen here.. 

>{httpsElasticsearchServer}/${collectionNameInSmallsAndSpacesTrimmed}/_search?pretty=true&q=*:*&size=100

>eg: http://localhost:9200/crazygooseflock/_search?pretty=true&q=*:*

-------------------------

#### Test Similarity Service for any Collection. 

We must add metadataFields for the for the newly indexed Collection in collectionMetadataFieldsMap in config.js file .
These fields are automatedly used to generate similarity and function score elastisearch queries.  
            
        ${collectionName} :{
            metadataFields : [ "texField1", "texField2", "texField3", ...]
            metadataLongFields : [ "longField1", "longField2" ]
        }
    

MetadataFields/NFTProperties already configured for the collections "AlgoSeas Pirates" , "Crazy Goose Flock", "Totally Average Cats", "Higher Ape Circle", "AlgoSkulls" in the  [config.js](config.js).  
checkout the examples here in  [config.js](config.js).



Get Similar NFTs with the below API call now:
    
> https://{ApiServer}/api/similarityService/similarNFTs?limit=50&assetId={assetid}&collectionName={collectionName}

Returns givenNFT, similarListingsNFTs, similarSaleNFTs, similarNFTs(most similar amongst all Assets) along with the score for every Asset/NFT. 

> Egs: 
http://localhost:8443/api/similarityService/similarNFTs?limit=100&assetId=3070&collectionName=Crazy%20Goose%20Flock

>http://localhost:8443/api/similarityService/similarNFTs?limit=20&assetId=271&collectionName=AlgoSkulls

>http://localhost:8443/api/similarityService/similarNFTs?limit=20&assetId=201&collectionName=Totally%20Average%20Cats

>http://localhost:8443/api/similarityService/similarNFTs?limit=20&assetId=201&collectionName=Higher%20Ape%20Circle


explainScoring=true works here for any collection as well

>http://localhost:8443/api/similarityService/similarNFTs?limit=20&assetId=1960&collectionName=AlgoSkulls&explainScoring=true



Please note that where sometimes there is not enough Listings or Sales data for collections like "Crazy Goose Flock" there is not so much return in similarListingsNFTs or similarSaleNFTs . however we can still how efficient the system is looking at similarNFTs(includes unlisted NFTs as well along with computed scores.)

Also note that similarNFTs in the API response always has the NFTs with highest scores as we are querying all the Assets/NFTs in the collection.


>For any qns/queries I am here.. https://t.me/harshabakku


------------------------------------------------------------

###### live API setup on AWS server  

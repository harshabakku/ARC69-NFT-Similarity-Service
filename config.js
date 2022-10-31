/**
 * Basic configurations of the server
 * @author harsha bakku
 * @since 0.1
 * @version 0.1
 */

const dotenv = require('dotenv');
dotenv.config(); //leverage this and maintain separate .env files for different environments in the future.

(function() {
    // export configuration parameters
    module.exports = {

        elasticSearchServerURL : 'http://localhost:9200/', //local server

        fullCollectionURLPrefix : 'https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/', 

        collectionSalesURLPrefix : 'https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/sales',
        
        dataFetchInterval : 3600000,  //dataFetchandIndexInterval duration in milli secs, change it to 60 secs before go live.
 
        assetFetchBatchSize : 5000,

        expressServerPort : 8443,


        //@AlgoSeas Team upgrade this in future to array (to include more default collections)
        //periodic indexes and maintains full data of defaultCollection from the start of server.  
        defaultCollection : 'AlgoSeas Pirates', 

        
        //current code supports all the collections for whic metadataFields are added here...
        //indexCollection Assets,Listings,Sales using this: http://localhost:8443/api/similarityService/indexFullCollection?collectionName=AlgoSeas%20Pirates
        //get Similar NFTs using this: http://localhost:8443/api/similarityService/similarNFTs?limit=2&assetId=20393&collectionName=AlgoSeas%20Pirates 
        collectionMetadataFieldsMap  : {
          
            "AlgoSeas Pirates": {     
                metadataFields : [ "Back Hand",  "Back Item",  "Background",  "Background Accent",  "Body",  "Face",  "Facial Hair",  "Footwear",  "Front Hand",  "Hat",  "Head",  "Hip Item",  "Left Arm",  "Necklace",  "Overcoat",  "Pants",  "Pet",  "Right Arm",  "Scenery",  "Shirt",  "Shirts",  "Tattoo"],  
                metadataLongFields : ["combat", "constitution", "luck", "plunder"],                   
            },

            "Crazy Goose Flock": {                     
                metadataFields : [ " Beak",  " Body",  " Clothing",  " Eyes",  " Hat",  " Neck",  " Tattoo",  "Background"],  
                metadataLongFields : [],                   
            },
            
            "Totally Average Cats": {     
                metadataFields : [ "Background",  "Body",  "Eyes",  "Eyewear",  "Head",  "Mouth",  "Nose",  "Skin" ],  
                metadataLongFields : [],                   
            },

            "Higher Ape Circle": {     
                metadataFields : [ "Backgrounds",  "Body",  "Earring",  "Faces",  "Head ",  "Outfits"],  
                metadataLongFields : [],                   
            },

            "AlgoSkulls": {     
                metadataFields : [ "Accent",  "Background",  "Base",  "Bone",  "Bone Pot",  "Brains",  "Ears",  "Etching",  "Eyes",  "Hat"],  
                metadataLongFields : ["times_used"],                   
            },
        }
                    
    }
})();

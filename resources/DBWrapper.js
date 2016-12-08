'use strict';

var MongoClient = require('mongodb').MongoClient;


class MongoDBWrapper
{
	constructor(){}

	/*Application level methods*/

	//@improvement:client should do the date check if the db interface is not directly doing it
	FindDocumentsBetweenDates(oQuery, dtQueryStartDate, dtQueryEndDate, sFieldName, sTable)
	{
		const That = this;
		return new Promise((resolve, reject) => 
		{
			That.Find(oQuery, sTable).then((lstDocument) =>
			{
				const lstFilteredDocuments = lstDocument.filter(_document =>
				{
					const dtDocumentDate = new Date(_document[sFieldName]);
					if(dtDocumentDate >= dtQueryStartDate && dtDocumentDate <= dtQueryEndDate)
						return true;
					else 
						return false;
				});

				//return docs to promise
				resolve(lstFilteredDocuments);
			}, 
			(err) => reject(err))
			.catch(err => console.log("Error when finding docs between date", err));
		});
	}


	/*Abstract Base level methods*/


	Connect(sDBUrl)
	{
		this.Url = sDBUrl;
		this.database = null;
		const That = this;

		// Use connect method to connect to the server
		MongoClient.connect(That.Url).then((db) => {
			console.log(`\n\nDATABASE successfully connected on connection ${That.Url}\n\n`);
			That.database = db;
		}, 
		(err) => 
		{
			console.log(`Error while attempting to connect to db ${err}`);
		})
		.catch(err => console.log("Catch during connect call"));
	}

	Insert(lstDocument, sTable)
	{
  	  	console.log(`Pushing to db table ${sTable} with documents ${jst(lstDocument)}`);

		return new Promise((resolve, reject) =>
		{
			//get our database reference
			const Database = this.database;

			//get our desired table
			const collection = Database.collection(sTable);

			if(collection)
			{
				// Insert some documents
				collection.insertMany(lstDocument).then((oResult) =>
				{
					console.log(`successfully inserted docs ${lstDocument}`);
					resolve(oResult);
				}, (err) => 
				{
					console.log(`error inserting docs ${lstDocument} - ${err}`);
					reject(err);
				})
				.catch(err => console.log("Catch during insertion call ", err));
			}
		})
	}

	Find(oQuery, sTable)
	{
		const That = this;

		//return a promise of the results
		return new Promise((resolve, reject) => 
		{
			//get our database reference
			const Database = That.database;

			// Get the documents collection
			var collection = Database.collection(sTable);

			// Find some documents
			collection.find(oQuery).toArray().then((lstDocument) =>
			{
				console.log(`successfully found ${lstDocument.length}`);
				resolve(lstDocument)
			},
			(err) =>
			{
				console.log(`error finding documents with query ${jst(oQuery)} - ${err}`);
				reject(err);
			}).catch(err => console.log("Catch Find() ERROR: ", err));   
		});
	}
}

//export our a new class instance
module.exports = new MongoDBWrapper();

function jst(o)
{
    return JSON.stringify(o, null, "\t");
}
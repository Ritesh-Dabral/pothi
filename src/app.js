
/**
 * Prints only the basic report every 1 min and after first 5mins, the collaborative report
 */
var startTime = new Date();
console.log(`--- START TIME: ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()}\n
    THE DATA WILL BE SHOWN AFTER EVERY ONE MINUTE FROM THE START OF THE PROGRAM
\n`);

/**
 * GLOBAL VARIABLE DECLERATION
 */
var gloCountMinutes = 1;
const domainReport = new Map();
const userReport = new Map();
const domain5min = new Map();
const user5min = new Map();


/*
*
* ------------------------------------------------------------------------------------------------------ *
*
*/
var EventSource = require('eventsource');
var url = 'https://stream.wikimedia.org/v2/stream/revision-create';

console.log(`Connecting to EventStreams at ${url}`);
var eventSource = new EventSource(url);

eventSource.onopen = function(event) {
    console.log('--- Opened connection.');
};

eventSource.onerror = function(event) {
    console.error('--- Encountered error', event);
};

eventSource.onmessage = function(event) {

    if(gloCountMinutes!==5){
        // event.data will be a JSON string containing the message event.    
        let wikiData = JSON.parse(event.data);

        //console.log(wikiData);
        let domainName = wikiData['meta']['domain'];
        let page_title = wikiData['page_title'];
        let {performer} = wikiData;

        // domainReport
        if(domainReport.has(domainName)){

            setDomain(domainReport,domainName,page_title);
            // update global
            setDomain(domain5min,domainName,page_title);
            
        }
        else{
            // if the domain key doesn't exist, create one
            let pages = new Set();
            pages.add(page_title);
            domainReport.set(domainName, {"pages": pages});
            domain5min.set(domainName, {"pages": pages});
        }


        // user report, if domain name is 'en.wikipedia.org' and user is not bot
        if(domainName==='en.wikipedia.org' && !performer['user_is_bot']){
            // check if user already exists
            let user_text = performer['user_text'];

            if(userReport.has(user_text)){

                setUser(userReport,user_text);
                // set global
                setUser(user5min,user_text);

            }
            else{
                // if the user key doesn't exist, create one
                userReport.set(user_text, {"count": 1});
                user5min.set(user_text, {"count": 1});
            }
        }
    }
};


/**
 * 
 * @param {*} tempUserReport : a map object
 * @param {*} user_text : name of user
 */
function setUser(tempUserReport,user_text){
    // domain exists, then update its count
    let lastUserData = tempUserReport.get(user_text);
    let {count} = lastUserData; 
    tempUserReport.set(user_text, {"count": count+1});
}

/**
 * 
 * @param {*} tempdomainReport : takes a map object
 * @param {*} domainName : a domain name for adding it to Map 
 * @param {*} page_title : title of page to add it in Set
 */
function setDomain(tempdomainReport,domainName,page_title){
    // domain exists, then update its count
    let lastWikiData = tempdomainReport.get(domainName);
    let {pages} = lastWikiData; 
    let newPages = new Set();
    for (let item of pages){
        newPages.add(item);
    }
    newPages.add(page_title);
    tempdomainReport.set(domainName, {"pages": newPages});
}


/**
 * Custom comparator
 * 
 * @param {*} obj1 : object 1
 * @param {*} obj2 : object 2
 */
function compare( obj1, obj2 ) {
    if ( obj1.count > obj2.count ){
      return -1;
    }
    if ( obj1.count < obj2.count ){
      return 1;
    }
    return 0;
}


/**
 * Loops through Map entities and then sorts them based on count
 * 
 * @param {*} tempdomainReport : takes a map object
 */
function showDomain(tempdomainReport){
    console.log(`\n\n----DOMAIN REPORT min ${gloCountMinutes}----`);
    console.log(`Total number of Wikipedia Domains Updated: ${tempdomainReport.size}\n`);

    let arr = [];
    tempdomainReport.forEach(function(value, key) {
        let {pages} = value;
        arr.push({"domain":key,"count":pages.size});
    });

    arr.sort(compare);
    arr.forEach(ele=>{
        let {domain,count} = ele;
        console.log(`${domain}: ${count} pages updated`);
    })
}


/**
 * Loops through Map entities and then sorts them based on count
 * 
 * @param {*} tempUserReport : takes a Map Object
 */
function showUser(tempUserReport){
    console.log(`\n\n----USERS REPORT min ${gloCountMinutes}----`);
    console.log(`Users who made changes to en.wikipedia.org\n`);
    let arr=[];
    tempUserReport.forEach(function(value, key) {
        let {count} = value;
        arr.push({"user":key,"count":count});
    });

    arr.sort(compare);
    arr.forEach(ele=>{
        let {user,count} = ele;
        console.log(`${user}: ${count}`);
    })
}


/**
 * Run to execute related functions
 */
setInterval(()=>{

    if(gloCountMinutes!==5){
        showDomain(domainReport);
        showUser(userReport);
    }
    else{
        showDomain(domain5min);
        showUser(user5min);

        gloCountMinutes = 0;
        domain5min.clear();
        user5min.clear();
    }
    
    domainReport.clear();
    userReport.clear();
    gloCountMinutes+=1;
}, 60000)
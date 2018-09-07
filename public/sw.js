let staticCacheName = 'converter-v2';
let currencyValueCache = 'currencyValue-1';

let allCaches = [
	staticCacheName,
	currencyValueCache
];

const staticFiles = [
	'/shadrach1999.github.io/currency-coverter/dist/assets/css/styles.css',
	'/shadrach1999.github.io/currency-coverter/dist/assets/js/app.js',
	'/shadrach1999.github.io/currency-coverter/dist/assets/images/favicon.ico',
	'/shadrach1999.github.io/currency-coverter/index.html',
	'https://free.currencyconverterapi.com/api/v5/currencies'
]


self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName).then(cache => {
			console.log('adding all')
			return cache.addAll(staticFiles)
		})
		.catch(err => console.error(err))
	);
});

/*
	listen to activation event of the service worker 
	and add static files to cache and filter out all 
	invalid files
*/
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					return !allCaches.includes(cacheName);
				}).map(cacheName => caches.delete(cacheName))
			)
		}).catch(err => console.error(err))
	);
});

/*
	listen to fetch event of the service worker 
	and intercept special request to return to 
	the page
*/
self.addEventListener('fetch', event => {
	let url = new URL(event.request.url);

	if(url.pathname == '/api/v5/convert') {
		event.respondWith(serveCurrencyValue(event.request));
		return;
	}

	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request);
		})
	)
});

self.addEventListener('message', event => {
	if(event.data.action == 'skipWaiting') {
		console.log('skipWaiting');
		self.skipWaiting();
	}
})

function serveCurrencyValue(request) {
	const queryRegex = /[^(\w*?)](\w*.\w*)(?=&)/g;

	let queryUrl = queryRegex.exec(request.url)[1];
	return caches.open(currencyValueCache).then(cache => {
		return cache.match(queryUrl).then(async response => {
			let networkFetch = await fetch(request).then(networkResponse => {
				cache.put(queryUrl, networkResponse.clone());
				return networkResponse;
			})
			.catch(err => console.error(err));
			return response || networkFetch;
		})
	})
}
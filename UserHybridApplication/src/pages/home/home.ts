import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http, Headers } from '@angular/http';
import { Geolocation } from 'ionic-native';
import { AboutPage } from '../about/about';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
 @ViewChild('map') mapElement: ElementRef;
  	map: any;
  	url: string = 'http://10.0.0.234:4000/sender';
  	response: any;
  	routes: any[] = [];
  
  constructor(public navCtrl: NavController, public http: Http) {
  }

  ionViewDidLoad() {
	
	var headers = new Headers();
    var options = {
            enableHighAccuracy: false
    };

    Geolocation.getCurrentPosition(options).then((position) => {

      let latLng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      
      let mapOptions = {
      	center: latLng,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);  
      
      let marker = new google.maps.Marker({
                position: latLng,
                map: this.map,
                draggable:false,
                title: 'Your Location'
      });
      
      let Pcoords = {
      					"lat": position.coords.latitude,
      					"lan": position.coords.longitude
      				};

      this.http.post(this.url,JSON.stringify(Pcoords),{headers: headers}).subscribe((data) => { 

      	this.response = data.json();
      	console.log(this.response);

      	for(var i = 0; i < this.response.userStops.length; i++) {
      	
      		let stop = new google.maps.LatLng(this.response.userStops[i].loc.lat,this.response.userStops[i].loc.lon);
      		var marker = new google.maps.Marker({
                position: stop,
                map: this.map,
                draggable:false,
                label: {text: (i +1).toString()},
                title: (i +1) + '. ' + this.response.userStops[i].stopName
      		});
      		
      		for(var j = 0; j < this.response.userStops[i].routes.length; j++) {

      			let pad = (this.response.userStops[i].routes[j].vehicleDec).indexOf(" ");
      			this.routes.push({ 	"routeId" : (this.response.userStops[i].routes[j].routeId).toString(),
      								"eta": "5 mins",
      								"towards" : (this.response.userStops[i].routes[j].vehicleDec).slice(pad),
      								"at" : (i + 1),
      								"tripId" : this.response.userStops[i].routes[j].tripId,
      								"userLoc": {
      									"lat": position.coords.latitude,
      									"lon": position.coords.longitude
      								},
      								"stop" : {
      									"lat" : this.response.userStops[i].loc.lat,
      									"lon" : this.response.userStops[i].loc.lon
      								},
      								"stop_seq" : this.response.userStops[i].routes[j].stop_seq
      							});
      		}
      		
      	}
      
      });
      
    }, (err) => {

    	let latLng = new google.maps.LatLng(36.7783,-119.4179);
    	let mapOptions = {
        	center: latLng,
        	zoom: 15,
        	mapTypeId: google.maps.MapTypeId.ROADMAP
        }
    	this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    	this.map = new google.maps.Marker({
                position: latLng,
                map: this.map,
                draggable:false
      	}); 
      	console.log('Error getting current location: ' + err + ';Location initilaized to CA!');
    });
}

navigate(item) {

	this.navCtrl.push(AboutPage, {"data": item });
}

}

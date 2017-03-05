import { Component, Directive } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleMapsAPIWrapper } from 'angular2-google-maps/core/services/google-maps-api-wrapper';
declare var google: any;
import { busPath } from './services/busPath.services';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-root',
  templateUrl: './html/app.component.html',
  styleUrls: ['./html/app.component.css'],
  providers: [busPath, GoogleMapsAPIWrapper]
})
export class AppComponent {
  title: string = 'VTA- Supervision';
  data: busPaths[] = [];
  lat: number = 37.327593;
  lng: number =-121.903400;
  zoom:number= 13;
  ready: boolean = false;
  currentRouteSelection: point[];
  constructor(private _friendService: busPath, private gmapsApi: GoogleMapsAPIWrapper) {
    _friendService.getBusPath().subscribe(busPath => {
      var flightPlanCoordinates = [];
      for (let entry of busPath) {
        var routes = new busPaths();
        routes.routeId = entry.json_build_object.routeId;
        var locations = entry.json_build_object.location;
        var ind = 0;
        for (let dt of locations) {
          if ((ind % 5 === 0 || ind == 1) && ind != 0) {
            var ts = dt.trim().split(" ");
            var tsA = locations[ind - 1].trim().split(" ");

            if (getDistanceFromLatLonInKm(parseInt(ts[1]), parseInt(ts[0]), parseInt(tsA[1]), parseInt(tsA[0])) < 3) {
              var gmapPoints = new point();
              gmapPoints.lat = + ts[1];
              gmapPoints.lng = + ts[0];
              gmapPoints.latA = + tsA[1];
              gmapPoints.lngA = + tsA[0];
              routes.location.push(gmapPoints);
            }
          }
          ind++
        }
        this.data.push(routes);
      }
      console.log("fetched");
      this.ready = true;
    });
  }
  public setCurrentRouteSelection = (currentRoute) => {
    this.currentRouteSelection = currentRoute.location;
    this.lat=+this.currentRouteSelection[0].lat;
    this.lng=+this.currentRouteSelection[0].lng;
  }

}

class busPaths {
  location: point[] = [];
  routeId: string;
}

class point {
  lat: number;
  lng: number;
  latA: number;
  lngA: number;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
import { Component, Input } from '@angular/core';
import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

@Injectable()
export class busPath {
  data: busPaths[];
  constructor(private http: Http) {
  }

  getBusPath(): Observable<busPaths[]> {
    return this.http.get('assets/data/busPath.json')
      .map((res) => res.json())
  }
}

interface busPaths {
  json_build_object: {
    location: string[],
    routeId: string
  }
}
import { Http, Headers, Response } from "@angular/http";
import { Observable } from "rxjs/Rx"
import { Injectable } from "@angular/core";

@Injectable()
export class DaoUtil {

  constructor(private http: Http) { }

  get(url: string): Observable<Response> {
    return this.http.get(url, { headers: DaoUtil.getHeaders() });
  }

  post(url: string, data: any): Observable<Response> {
    return this.http.post(url, data, { headers: DaoUtil.getHeaders() });
  }

  private static getHeaders(): Headers {
    let headers = new Headers();
    headers.append('Access-Control-Allow-Origin', `http://${document.domain}:${location.port}`);
    headers.append('Accept', 'application/json');
    return headers;
  }

  static logError(err) {
    console.log('sth wrong when fetching data. ' + err);
  }

  static checkCode(ret) {
    if (ret.code !== 20000) {
      alert(ret.body);
      return null;
    }
    return ret.body;
  }
}

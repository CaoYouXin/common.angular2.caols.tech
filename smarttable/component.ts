import {Component, Input, OnInit} from "@angular/core";
import {DaoUtil} from "../dao/dao.util";
import "rxjs/add/operator/map";

@Component({
    selector: 'smart-table',
    template: `
        <div class="tools v-mid-box">
            <div class="btn" [class.disabled]="template.saveUrl===null" (click)="add($event)">添加</div>
            <div class="btn" [class.disabled]="template.saveUrl===null" (click)="modify($event)">修改</div>
            <div class="btn" [class.disabled]="template.deleteUrl===null" (click)="deleteA($event)">删除</div>
        </div>

        <table>
            <thead>
            <tr>
                <th><input type="checkbox" [(ngModel)]="selectAll" (change)="dataCheckChange($event)"></th>
                <th *ngFor="let col of template.cols" [style.maxWidth]="col.width || 'auto'">{{col.text}}</th>
            </tr>
            </thead>
            <tbody>
            <tr *ngFor="let row of data;let index = index;">
                <td><input type="checkbox" [(ngModel)]="dataCheck[index]" (change)="dataCheckInRowChange($event)"></td>
                <td *ngFor="let col of template.cols" [style.maxWidth]="col.width || 'auto'">{{process(row[col.name], col)}}</td>
            </tr>
            </tbody>
        </table>

        <div class="editor-mask" *ngIf="editing"></div>

        <div [id]="editorId" class="editor" *ngIf="editing"
             [style.visibility]="editorVisibility"
             [style.top]="editorTop" [style.left]="editorLeft">
            <table>
                <tbody>
                <tr *ngFor="let col of template.cols;let index = index;">
                    <td>{{col.text}}</td>
                    <td><input [id]="col.name" [(ngModel)]="editor[index]" (focus)="editorFocus(col, $event)"
                               (change)="editorChange(index, $event)" [disabled]="col.disabled" [type]="col.type"></td>
                </tr>
                </tbody>
            </table>
            <div class="v-mid-box">
                <div class="btn" (click)="submit($event)">确定</div>
                <div class="btn" (click)="cancel($event)">取消</div>
            </div>
        </div>

        <div class="combo-mask" *ngIf="comboing"></div>

        <ul [id]="comboId" class="combo" *ngIf="comboing"
            [style.visibility]="comboVisibility"
            [style.top]="comboTop" [style.left]="comboLeft">
            <li *ngFor="let combo of combos" (click)="comboClick(combo)">{{combo[comboValue]}}</li>
        </ul>
    `,
    styles: [`
        .tools {
            height: 30px;
            text-align: left;
            border-top: solid 1px #111111;
        }

        .btn {
            height: 20px;
            line-height: 20px;
            font-size: 12px;
            padding: 0 1em;
            border-radius: 10px;
            border: solid 1px #dddddd;
            margin-left: 1em;
            cursor: default;
        }
        
        .btn.disabled {
            color: #999999;
        }

        .btn.disabled:hover {
            color: #999999;
            text-shadow: none;
            background-image: none;
        }

        .btn:hover {
            color: #1d1d1b;
            text-shadow: 1px 1px 2px red;
            background-image: linear-gradient(90deg, wheat, #999999 50%, wheat);
        }

        table {
            width: 100%;
            margin: 0 auto;
            border-collapse: collapse;
        }

        table, th, td {
            border: 1px solid rgba(0, 0, 0, 0.1);
        }

        th, td {
            line-height: 2em;
            text-align: center;

            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        th {
            font-size: 1.3em;
            font-weight: 900;
            background-color: #cac5ff;
        }

        td {
            font-size: 1em;
        }

        tr:nth-child(odd) > td {
            background-color: #cdffd2;
        }

        tr:nth-child(even) > td {
            background-color: #edffd5;
        }

        .editor-mask {
            position: fixed;
            z-index: 5000;

            top: 0;
            right: 0;
            bottom: 0;
            left: 0;

            background-color: rgba(0, 0, 0, 0.5);
        }

        .editor {
            position: fixed;
            z-index: 5001;

            min-width: 200px;

            top: 50%;
            left: calc(50% - 100px);

            padding: 10px;
            border-radius: 10px;
            border: solid 1px #111111;
            box-shadow: 0 0 5px #010101;
            background-color: whitesmoke;
        }

        .editor input {
            outline: none;
            line-height: 16px;
        }

        .editor input:focus {
            box-shadow: 0 0 5px black;
        }

        .combo-mask {
            position: fixed;
            z-index: 6000;

            top: 0;
            right: 0;
            bottom: 0;
            left: 0;

            background-color: rgba(0, 0, 0, 0.5);
        }

        ul.combo {
            list-style: none;

            position: fixed;
            z-index: 6001;

            top: 50%;
            left: calc(50% - 100px);

            padding: 10px;
            border-radius: 10px;
            border: solid 1px #111111;
            box-shadow: 0 0 5px #010101;
            background-color: whitesmoke;
        }

        ul.combo > li {
            width: 200px;

            cursor: default;
        }

        ul.combo > li:hover {
            background-color: #dddddd;
        }
    `],
    providers: [DaoUtil]
})
export class SmartTableComponent implements OnInit {

    @Input()
    template: any;

    editorId: string;
    comboId: string;

    data: Array<any>;
    combos: Array<any>;

    editorVisibility: string;
    editorTop: string;
    editorLeft: string;

    comboVisibility: string;
    comboTop: string;
    comboLeft: string;

    selectAll: boolean;
    comboKey: string;
    comboValue: string;
    comboTarget: string;
    comboCol: string;

    dataCheck = [];
    editor = [];
    editing = false;
    comboing = false;

    constructor(private dao: DaoUtil) {
    }

    ngOnInit() {
        this.editorId = this.template.editorId;
        this.comboId = this.template.comboId;

        const self = this;
        this.dao.get(this.template.fetchUrl)
            .map(res => res.json())
            .subscribe(ret => {
                if (ret.code !== 20000) {
                    alert(ret.body);
                    return;
                }

                self.data = ret.body;
            });


    }

    process(value, col) {
        if (col.inplaceCategory) {
            return col.inplaceCategory[value];
        }

        return value;
    }

    callEditor() {
        this.editorVisibility = 'hidden';
        this.editing = true;
        setTimeout(function (self) {
            let elementById = document.getElementById(self.editorId);
            self.editorLeft = 'calc(50% - ' + (elementById.offsetWidth / 2) + 'px)';
            self.editorTop = 'calc(50% - ' + (elementById.offsetHeight / 2) + 'px)';
            self.editorVisibility = 'visible';
        }, 200, this);
    }

    callCombo() {
        this.comboVisibility = 'hidden';
        this.comboing = true;
        setTimeout(function (self) {
            let elementById = document.getElementById(self.comboId);
            self.comboLeft = 'calc(50% - ' + (elementById.offsetWidth / 2) + 'px)';
            self.comboTop = 'calc(50% - ' + (elementById.offsetHeight / 2) + 'px)';
            self.comboVisibility = 'visible';
        }, 200, this);
    }

    add(e) {
        if (this.template.saveUrl === null) {
            return;
        }

        this.editor = [];
        this.callEditor();
    }

    modify(e) {
        if (this.template.saveUrl === null) {
            return;
        }

        let rowId = this.dataCheck.reduce((p, v, i) => {
            if (p < 0 && v) {
                return i;
            }
            return p;
        }, -1);

        if (rowId < 0) {
            return;
        }

        this.template.cols.forEach((col, index) => {
            this.editor[index] = this.data[rowId][col.name];
        });

        this.callEditor();
    }

    deleteA() {
        if (this.template.deleteUrl === null) {
            return;
        }

        const deleteIds = [];
        this.dataCheck.forEach((check, index) => {
            if (check) {
                deleteIds.push(this.data[index][this.template.key]);
            }
        });

        const self = this;
        this.dao.post(this.template.deleteUrl, {
            ids: deleteIds
        }).map(res => res.json())
            .subscribe(ret => {
                if (ret.code !== 20000) {
                    alert(ret.body);
                    return;
                }

                self.data = ret.body;
            });
    }

    submit() {
        const self = this;
        const postData = {};
        this.template.cols.forEach((col, index) => {
            if (!!col.combo) {
                return;
            }
            let value = this.editor[index] === undefined ? null : this.editor[index];
            if (col.prefix) {
                value = col.prefix + value;
            }
            postData[col.name] = value;
        });

        self.dao.post(self.template.saveUrl, postData)
            .map(res => res.json())
            .subscribe(ret => {
                if (ret.code !== 20000) {
                    alert(ret.body);
                    self.editing = false;
                    return;
                }

                self.data = ret.body;
                self.editing = false;
            });
    }

    cancel() {
        this.editing = false;
    }

    dataCheckChange(e) {
        for (let i = 0; i < this.data.length; i++) {
            this.dataCheck[i] = e.target.checked;
        }
    }

    dataCheckInRowChange(e) {
        if (!e.target.checked) {
            this.selectAll = false;
        }
    }

    editorChange(i, e) {
        this.editor[i] = e.target.checked;
    }

    combo(col) {
        this.comboKey = col.key;
        this.comboValue = col.value;
        this.comboTarget = col.combo;
        this.comboCol = col.name;

        const self = this;
        this.dao.get(col.url)
            .map(res => res.json())
            .subscribe(ret => {
                if (ret.code !== 20000) {
                    alert(ret.body);
                    return;
                }

                self.combos = ret.body;
                self.callCombo();
            });
    }

    inplaceCombo(col) {
        this.comboKey = null;
        this.comboValue = col.inplaceCombo;
        this.comboTarget = null;
        this.comboCol = col.name;

        this.combos = col.data;
        this.callCombo();
    }

    editorFocus(col) {
        if (col.combo) {
            this.combo(col);
        }

        if (col.inplaceCombo) {
            this.inplaceCombo(col);
        }
    }

    comboClick(combo) {
        const self = this;
        this.template.cols.forEach((col, index) => {
            if (col.name === self.comboTarget) {
                this.editor[index] = combo[self.comboKey];
            }

            if (col.name === self.comboCol) {
                this.editor[index] = combo[self.comboValue];
            }
        });

        this.comboing = false;
    }

}

/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NgZone, SimpleChange, TemplateRef } from '@angular/core';
import { DataTableComponent, DataColumn, DataRowEvent } from 'ng2-alfresco-datatable';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { CoreModule } from 'ng2-alfresco-core';
import { DocumentListComponent } from './document-list.component';
import { DocumentListService } from './../services/document-list.service';
import { ContentActionModel } from '../models/content-action.model';
import { FileNode, FolderNode } from '../assets/document-library.model.mock';
import { NodeMinimalEntry, NodeMinimal, NodePaging } from '../models/document-library.model';
import { ShareDataRow, RowFilter, ImageResolver } from './../data/share-datatable-adapter';
import { DataTableModule } from 'ng2-alfresco-datatable';
import { DocumentMenuActionComponent } from './document-menu-action.component';

describe('DocumentList', () => {

    let documentList: DocumentListComponent;
    let fixture: ComponentFixture<DocumentListComponent>;
    let element: HTMLElement;
    let eventMock: any;
    let componentHandler;

    beforeEach(async(() => {
        let zone = new NgZone(false);

        TestBed.configureTestingModule({
            imports: [
                CoreModule.forRoot(),
                DataTableModule.forRoot()
            ],
            declarations: [
                DocumentListComponent,
                DocumentMenuActionComponent
            ],
            providers: [
                DocumentListService,
                {provide: NgZone, useValue: zone}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        eventMock = {
            preventDefault: function () {
                console.log('mock preventDefault');
            }
        };

        componentHandler = jasmine.createSpyObj('componentHandler', [
            'upgradeAllRegistered'
        ]);
        window['componentHandler'] = componentHandler;

        fixture = TestBed.createComponent(DocumentListComponent);

        element = fixture.nativeElement;
        documentList = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should setup default columns', () => {
        documentList.ngAfterContentInit();

        expect(documentList.data.getColumns().length).not.toBe(0);
    });

    it('should add the custom columns', () => {
        let column = <DataColumn> {
            title: 'title',
            key: 'source',
            cssClass: 'css',
            srTitle: '',
            type: 'text',
            format: ''
        };

        let columns = documentList.data.getColumns();
        columns.push(column);

        documentList.ngAfterContentInit();
        expect(columns.length).toBe(3);
        expect(columns[2]).toBe(column);
    });

    it('should execute action with node', () => {
        let node = new FileNode();
        let action = new ContentActionModel();
        action.handler = function () {
            console.log('mock handler');
        };

        spyOn(action, 'handler').and.stub();

        documentList.executeContentAction(node, action);
        expect(action.handler).toHaveBeenCalledWith(node, documentList);

    });

    it('should not execute action without node provided', () => {
        let action = new ContentActionModel();
        action.handler = function () {
            console.log('mock handler');
        };

        spyOn(action, 'handler').and.stub();
        documentList.executeContentAction(null, action);
        expect(action.handler).not.toHaveBeenCalled();
    });

    it('should not give node actions for empty target', () => {
        let actions = documentList.getNodeActions(null);
        expect(actions.length).toBe(0);
    });

    it('should filter content actions for various targets', () => {
        let folderMenu = new ContentActionModel();
        folderMenu.target = 'folder';

        let documentMenu = new ContentActionModel();
        documentMenu.target = 'document';

        documentList.actions = [
            folderMenu,
            documentMenu
        ];

        let actions = documentList.getNodeActions(new FolderNode());
        expect(actions.length).toBe(1);
        expect(actions[0]).toBe(folderMenu);

        actions = documentList.getNodeActions(new FileNode());
        expect(actions.length).toBe(1);
        expect(actions[0]).toBe(documentMenu);
    });

    it('should find no content actions', () => {
        let documentButton = new ContentActionModel();
        documentButton.target = 'document';
        documentList.actions = [documentButton];

        let node = new NodeMinimalEntry();
        expect(documentList.getNodeActions(node)).toEqual([]);

        node = new FileNode();
        node.entry.isFile = false;
        node.entry.isFolder = false;
        expect(documentList.getNodeActions(node)).toEqual([]);
    });

    it('should emit nodeClick event', (done) => {
        let node = new FileNode();
        documentList.nodeClick.subscribe(e => {
            expect(e.value).toBe(node);
            done();
        });
        documentList.onNodeClick(node);
    });

    it('should display folder content on click', () => {
        let node = new FolderNode('<display name>');

        spyOn(documentList, 'loadFolder').and.returnValue(Promise.resolve(true));

        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.onNodeClick(node);

        expect(documentList.loadFolder).toHaveBeenCalled();
    });

    it('should not display folder content when no target node provided', () => {
        expect(documentList.navigate).toBe(true);
        spyOn(documentList, 'loadFolder').and.stub();

        documentList.onNodeClick(null);
        expect(documentList.loadFolder).not.toHaveBeenCalled();

    });

    it('should display folder content only on folder node click', () => {
        expect(documentList.navigate).toBe(true);
        spyOn(documentList, 'loadFolder').and.stub();

        let node = new FileNode();
        documentList.onNodeClick(node);

        expect(documentList.loadFolder).not.toHaveBeenCalled();
    });

    it('should not display folder content on click when navigation is off', () => {
        spyOn(documentList, 'loadFolder').and.stub();

        let node = new FolderNode('<display name>');
        documentList.navigate = false;
        documentList.onNodeClick(node);

        expect(documentList.loadFolder).not.toHaveBeenCalled();
    });

    it('should execute context action on callback', () => {
        let action = {
            node: {},
            model: {}
        };

        spyOn(documentList, 'executeContentAction').and.stub();
        documentList.contextActionCallback(action);
        expect(documentList.executeContentAction).toHaveBeenCalledWith(action.node, action.model);
    });

    it('should not execute context action on callback', () => {
        spyOn(documentList, 'executeContentAction').and.stub();
        documentList.contextActionCallback(null);
        expect(documentList.executeContentAction).not.toHaveBeenCalled();
    });

    it('should subscribe to context action handler', () => {
        spyOn(documentList, 'loadFolder').and.stub();
        spyOn(documentList, 'contextActionCallback').and.stub();
        let value = {};
        documentList.ngOnInit();
        documentList.contextActionHandler.next(value);
        expect(documentList.contextActionCallback).toHaveBeenCalledWith(value);
    });

    it('should suppress default context menu', () => {
        documentList.contextMenuActions = true;
        spyOn(eventMock, 'preventDefault').and.stub();
        documentList.onShowContextMenu(eventMock);
        expect(eventMock.preventDefault).toHaveBeenCalled();
    });

    it('should not suppress default context menu', () => {
        documentList.contextMenuActions = false;
        spyOn(eventMock, 'preventDefault').and.stub();
        documentList.onShowContextMenu(eventMock);
        expect(eventMock.preventDefault).not.toHaveBeenCalled();
    });

    it('should emit file preview event on single click', (done) => {
        let file = new FileNode();
        documentList.preview.subscribe(e => {
            expect(e.value).toBe(file);
            done();
        });
        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.onNodeClick(file);
    });

    it('should emit file preview event on double click', (done) => {
        let file = new FileNode();
        documentList.preview.subscribe(e => {
            expect(e.value).toBe(file);
            done();
        });
        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(file);
    });

    it('should perform folder navigation on single click', () => {
        let folder = new FolderNode();
        spyOn(documentList, 'performNavigation').and.stub();

        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.onNodeClick(folder);
        expect(documentList.performNavigation).toHaveBeenCalled();
    });

    it('should perform folder navigation on double click', () => {
        let folder = new FolderNode();
        spyOn(documentList, 'performNavigation').and.stub();

        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(folder);
        expect(documentList.performNavigation).toHaveBeenCalled();
    });

    it('should not perform folder navigation on double click when single mode', () => {
        let folder = new FolderNode();
        spyOn(documentList, 'performNavigation').and.stub();

        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(folder);

        expect(documentList.performNavigation).not.toHaveBeenCalled();
    });

    it('should not perform folder navigation on double click when navigation off', () => {
        let folder = new FolderNode();
        spyOn(documentList, 'performNavigation').and.stub();

        documentList.navigate = false;
        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(folder);

        expect(documentList.performNavigation).not.toHaveBeenCalled();
    });

    it('should perform navigation for folder node only', () => {
        let folder = new FolderNode();
        let file = new FileNode();

        expect(documentList.performNavigation(folder)).toBeTruthy();
        expect(documentList.performNavigation(file)).toBeFalsy();
        expect(documentList.performNavigation(null)).toBeFalsy();
    });

    it('should require valid node for file preview', () => {
        let file = new FileNode();
        file.entry = null;
        let called = false;

        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.preview.subscribe(val => called = true);

        documentList.onNodeClick(file);
        expect(called).toBeFalsy();

        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(file);
        expect(called).toBeFalsy();
    });

    it('should require valid node for folder navigation', () => {
        let folder = new FolderNode();
        folder.entry = null;
        spyOn(documentList, 'performNavigation').and.stub();

        documentList.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        documentList.onNodeClick(folder);

        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.onNodeDblClick(folder);

        expect(documentList.performNavigation).not.toHaveBeenCalled();
    });

    it('should display folder content from loadFolder on reload if folderNode defined', () => {
        documentList.folderNode = new NodeMinimal();

        spyOn(documentList, 'loadFolder').and.callThrough();
        documentList.reload();
        expect(documentList.loadFolder).toHaveBeenCalled();
    });

    it('should display folder content from loadFolderByNodeId on reload if currentFolderId defined', () => {
        documentList.currentFolderId = 'id-folder';
        spyOn(documentList, 'loadFolderByNodeId').and.callThrough();
        documentList.reload();
        expect(documentList.loadFolderByNodeId).toHaveBeenCalled();
    });

    it('should display folder content from loadFolderByNodeId on reload if node defined', () => {
        documentList.node = new NodePaging();

        spyOn(documentList.data, 'loadPage').and.callThrough();
        documentList.reload();
        expect(documentList.data.loadPage).toHaveBeenCalled();
    });

    it('should require node to resolve context menu actions', () => {
        expect(documentList.getContextActions(null)).toBeNull();

        let file = new FileNode();
        file.entry = null;

        expect(documentList.getContextActions(file)).toBeNull();
    });

    it('should fetch context menu actions for a file node', () => {
        let actionModel = {};
        spyOn(documentList, 'getNodeActions').and.returnValue([actionModel]);

        let file = new FileNode();
        let actions = documentList.getContextActions(file);

        expect(documentList.getNodeActions).toHaveBeenCalledWith(file);
        expect(actions.length).toBe(1);
        expect(actions[0].model).toBe(actionModel);
        expect(actions[0].node).toBe(file);
        expect(actions[0].subject).toBe(documentList.contextActionHandler);
    });

    it('should fetch context menu actions for a folder node', () => {
        let actionModel = {};
        spyOn(documentList, 'getNodeActions').and.returnValue([actionModel]);

        let folder = new FolderNode();
        let actions = documentList.getContextActions(folder);

        expect(documentList.getNodeActions).toHaveBeenCalledWith(folder);
        expect(actions.length).toBe(1);
        expect(actions[0].model).toBe(actionModel);
        expect(actions[0].node).toBe(folder);
        expect(actions[0].subject).toBe(documentList.contextActionHandler);
    });

    it('should fetch no context menu actions for unknown type', () => {
        spyOn(documentList, 'getNodeActions').and.stub();

        let node = new FileNode();
        node.entry.isFile = false;
        node.entry.isFolder = false;

        let actions = documentList.getContextActions(node);
        expect(actions).toBeNull();
    });

    it('should return null value when no content actions found', () => {
        spyOn(documentList, 'getNodeActions').and.returnValue([]);

        let file = new FileNode();
        let actions = documentList.getContextActions(file);

        expect(actions).toBeNull();
        expect(documentList.getNodeActions).toHaveBeenCalled();
    });

    it('should enforce single-click on mobile browser', () => {
        spyOn(documentList, 'isMobile').and.returnValue(true);
        documentList.navigationMode = DocumentListComponent.DOUBLE_CLICK_NAVIGATION;
        documentList.ngOnInit();
        expect(documentList.isMobile).toHaveBeenCalled();
        expect(documentList.navigationMode).toBe(DocumentListComponent.SINGLE_CLICK_NAVIGATION);
    });

    it('should emit error on wrong folder id', (done) => {
        documentList.error.subscribe(() => {
            done();
        });

        documentList.currentFolderId = 'wrong-id';
        documentList.ngOnChanges({currentFolderId: new SimpleChange(null, documentList.currentFolderId)});
    });

    it('should require dataTable to check empty template', () => {
        documentList.dataTable = null;
        expect(documentList.isEmptyTemplateDefined()).toBeFalsy();
    });

    it('should check [empty folder] template ', () => {
        documentList.emptyFolderTemplate = <TemplateRef<any>> {};
        documentList.dataTable = new DataTableComponent(null);
        expect(documentList.dataTable).toBeDefined();
        expect(documentList.isEmptyTemplateDefined()).toBeTruthy();

        documentList.emptyFolderTemplate = null;
        expect(documentList.isEmptyTemplateDefined()).toBeFalsy();
    });

    it('should empty folder NOT show the pagination', () => {
        documentList.emptyFolderTemplate = <TemplateRef<any>> {};
        documentList.dataTable = new DataTableComponent(null);

        expect(documentList.isEmpty()).toBeTruthy();
        expect(element.querySelector('alfresco-pagination')).toBe(null);
    });

    it('should set row filter for underlying adapter', () => {
        let filter = <RowFilter> {};
        documentList.currentFolderId = 'id';
        spyOn(documentList.data, 'setFilter').and.callThrough();

        documentList.rowFilter = filter;
        expect(documentList.data.setFilter).toHaveBeenCalledWith(filter);
    });

    it('should set image resolver for underlying adapter', () => {
        let resolver = <ImageResolver> {};
        spyOn(documentList.data, 'setImageResolver').and.callThrough();

        documentList.imageResolver = resolver;
        expect(documentList.data.setImageResolver).toHaveBeenCalledWith(resolver);
    });

    it('should emit [nodeClick] event on row click', () => {
        let node = new NodeMinimalEntry();
        let row = new ShareDataRow(node);
        let event = new DataRowEvent(row, null);

        spyOn(documentList, 'onNodeClick').and.callThrough();
        documentList.onRowClick(event);
        expect(documentList.onNodeClick).toHaveBeenCalledWith(node);
    });

    it('should emit [nodeDblClick] event on row double-click', () => {
        let node = new NodeMinimalEntry();
        let row = new ShareDataRow(node);
        let event = new DataRowEvent(row, null);

        spyOn(documentList, 'onNodeDblClick').and.callThrough();
        documentList.onRowDblClick(event);
        expect(documentList.onNodeDblClick).toHaveBeenCalledWith(node);
    });

    it('should load folder by ID on init', () => {
        documentList.currentFolderId = '1d26e465-dea3-42f3-b415-faa8364b9692';
        spyOn(documentList, 'loadFolderNodesByFolderNodeId').and.returnValue(Promise.resolve());
        documentList.ngOnChanges({folderNode: new SimpleChange(null, documentList.currentFolderId)});
        expect(documentList.loadFolderNodesByFolderNodeId).toHaveBeenCalled();
    });
});

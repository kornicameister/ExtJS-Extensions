/*
 * In development, due to adjusting the extension to Ext 4.*, by kornicameister [Tomasz Trębski] -> kornicameister@gmail.com
 *
 * Originally created by
 * Marco Wienkoop (wm003/lubber) / copyright (c) 2009, Marco Wienkoop (marco.wienkoop@lubber.de) http://www.lubber.de
 *
 * Inspired by modifications by Joe Kuan - kuan.joe@gmail.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>

 * This Addon requires the ExtJS Library, which is distributed under the terms of the GPL v3 (from V2.1)
 * See http://extjs.com/license for more info
 *
 *
 * TODO 1 - provide generating custom handlers
 * TODO 2 - test reconfiguring
 * TODO 3 - xtemplate
 */

/**
 * @class Ext.ux.menu.StoreMenu
 * @author Tomasz Trębski
 * @description This is normal Ext.menu.Menu with just one difference. It is boosted up by underlying
 * store that provides data source for this menu.
 */
Ext.define('Ext.ux.menu.StoreMenu', {
    extend            : 'Ext.menu.Menu',
    alternateClassName: 'Ext.menu.StoreMenu',
    alias             : 'widget.storemenu',
    requires          : [
        'Ext.data.Store'
    ],

    /**
     * @cfg {Ext.data.Store/Object/String} either existing object of store
     * or literal or string with storeId.
     */
    store: undefined,

    /**
     * @private
     * This variable holds reference to local storage store, that is used
     * to map menu item to attached store item in order to fire custom
     * events
     */
    mapStore: undefined,

    /**
     * @cfg {Boolean} will be used to detect whether or not store should
     * reload before each menu expand
     */
    autoReload: false,

    /**
     * @cfg {String} defines path which is used by StoreMenu to find text
     * that will be displayed within menu
     */
    itemRef: 'name',

    initComponent: function () {
        var me = this;

        // adjusting map store
        me.mapStore = Ext.create('Ext.data.Store', {
            fields: [
                'id', 'itemId', 'storeItem', 'menuItem'
            ],
            proxy : {
                type: 'localstorage'
            }
        });

        // setting the store
        if (Ext.isDefined(me.store)) {
            me.store = Ext.StoreManager.lookup(me.store);
            if (!(me.store === null || !Ext.isDefined(me.store))) {
                // tapping events
                me.mon(me.store, 'datachanged', me.onStoreChanged, me);
                if (me.store.getCount() === 0 || me.store.getCount() < 0) {
                    me.mon(me.store, 'load', me.onStoreLoad, me);
                } else {
                    me.onStoreLoad(me.store);
                }
            }
        }

        // custom events
        me.addEvents(
            /**
             * @event iclick
             * @description Wrapper for Ext.menu.Menu's click event, that despite
             * passing item of the menu that has been clicked passes store item
             * that is tied to it.
             *
             * @param this, Ext.menu.menu
             * @param menuItem
             * @param storeItem
             */
            'iclick'
        );

        // wrappers
        me.mon(me, 'click', me.onItemClickWrapper, me);

        Ext.menu.Manager.register(me);
        me.callParent(arguments);
    },

    onItemClickWrapper: function (me, menuItem) {
        var storeMenuItem = me.mapStore.getById(menuItem['id']);

        if (Ext.isDefined(storeMenuItem)) {
            me.fireEvent('iclick', me, menuItem, storeMenuItem.get('storeItem'));
        }
    },

    onStoreLoad: function (store) {
        var me = this,
            cmp = undefined;

        me.removeAll(true);
        me.mapStore.removeAll(true);
        store = me.store || store;

        store.each(function (item) {
            cmp = me.add({
                text: item.get(me.itemRef)
            });
            me.mapStore.add({
                id       : cmp['id'],
                itemId   : item.getId(),
                storeItem: item,
                menuItem : cmp
            });
        });
    },

    onStoreChanged: function (store) {
        var me = this;
        store = me.store || store;
    },

    checkStore: function (me, store) {
        store = Ext.StoreManager.lookup(store);
        if (Ext.isDefined(me.store)) {
            me.mun(me.store);
            me.store = store;
        } else {
            me.store = store;
        }
        return me.store;
    },

    reconfigure: function (store) {
        var me = this;
        me.store = me.checkStore(me, store);

        // tapping events
        me.mon(me.store, 'datachanged', me.onStoreChanged, me);
        if (me.store.getCount() === 0 || me.store.getCount() < 0) {
            me.mon(me.store, 'load', me.onStoreLoad, me);
        } else {
            me.onStoreLoad(me.store);
        }
    },

    getStore: function () {
        return this.store;
    }
});
/* Depends on jQuery. 
 * Will handle TopoJSON and merging across tile boundaries if L.GeoJSON.PlusOne is included 
 */
L.TileLayer.GeoJSON = L.TileLayer.extend({
    
    onAdd: function onAdd(map) {
        var cacheClass = L.GeoJSON.PlusOne || L.GeoJSON,
            opts = this.options;
        
        this._cache = new cacheClass(null, opts);
        this._cache.addTo(map);
        
        L.TileLayer.prototype.onAdd.call(this, map);
        
        this.on("tileunload", function unloadTile(d) {
            d.tile.xhr.abort();
            d.tile.chr = null;
        });
        
        var self = this;
        map.on("zoomend", function zoomEnd(event) {
            map.removeLayer(self._cache);
            self._cache = new cacheClass(null, opts);
            self._cache.addTo(map);
        });
    },
    
    _loadTile: function loadTile(tile, tilePoint) {
        var self = this;
        
        this._adjustTilePoint(tilePoint);
            
        if (!tile.xhr) {
            tile.xhr = $.ajax({
                url: self.getTileUrl(tilePoint),
                cache: true,
                success: function ajaxSuccess(geojson) {
                    try { geojson = JSON.parse(geojson); } catch(err) {}
                    self._cache.addData(geojson);
                }
            });
        }
    }
});
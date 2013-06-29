/* If you haven't included JSTS, it'll still work, but won't try and merge features
 *  across tile boundaries. If you want to use TopoJSON, you need to include it. If
 *  you don't include it and try and add TopoJSON, you'll get nothing showing up.
 */

var jsts = jsts || null,
    topojson = topojson || null;

L.GeoJSON.PlusOne = L.GeoJSON.extend({    
    
    initialize: function initializePlusOne (jsonData, options) {
        this.existingFeatures = {};
        this.handlesMerging = jsts !== null && options.hasOwnProperty("idAttr");
        L.GeoJSON.prototype.initialize.call(this, jsonData, options);
    },
    
    addData: function addDataPlusOne(jsonData) {
        
        jsonData = L.Util.isArray(jsonData) ? {type: "FeatureCollection", features: jsonData} : jsonData
        
        if (jsonData.type === "Topology" && topojson !== null) {
            
            for (var layerKey in jsonData.objects) {
                geojson = topojson.feature(jsonData, jsonData.objects[layerKey]);
                this.addData(geojson);
            }
        }
        
        if (jsonData.type === "Feature" || jsonData.type === "FeatureCollection") {
            if (this.handlesMerging) {
                this.mergeData(jsonData);
            } 
            
            else {
                L.GeoJSON.prototype.addData.call(this, jsonData);
            }
        }
    },
    
    mergeData: function mergeDataPlusOne(geojson) {
        if (!this.handlesMerging) { return; }
        
        var jsonArray = L.Util.isArray(geojson) ? geojson : geojson.features || [geojson];
        
        jsonArray.forEach(function eachFeature(feature, index, array) {
            var pk = feature.properties[this.options.idAttr];
            if (pk in this.existingFeatures) {
                feature = this.mergeFeatures(feature, this.existingFeatures[pk]);  
                this.removeLayerById(pk);
            }
            
            this.existingFeatures[pk] = feature;
            L.GeoJSON.prototype.addData.call(this, feature);
            
        }, this);
    },
    
    removeLayerById: function removeLayerPlusOne(pk) {
        if (!this.handlesMerging) { return; }
        
        var pkField = this.options.idAttr;
        
        Object.keys(this._layers)
            .forEach(function eachLayerId(layerId, index, layers) {
                var layer = this._layers[layerId];
                if (layer.feature.properties[pkField] === pk) {
                    this.removeLayer(layer);
                }
            }, this);
    },
    
    mergeFeatures: function mergeFeatures(newFeature, oldFeature) {
        if (!this.handlesMerging) { return; }
        try {
        var pk = newFeature.properties[this.options.idAttr],
            reader = new jsts.io.GeoJSONReader(),
            writer = new jsts.io.GeoJSONWriter(),
            oldGeom = reader.read(oldFeature.geometry),
            newGeom = reader.read(newFeature.geometry),
            finalGeom = oldGeom.union(newGeom);
        } catch (ex) { 
            console.log(ex);
        }
        newFeature.geometry = writer.write(finalGeom);
        
        return newFeature;
    }
});
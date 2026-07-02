// Layers definition
const layers = {
    osm: new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: true
    }),
    satellite: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        }),
        visible: false
    }),
    hybrid: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        }),
        visible: false
    }),
    terrain: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
        }),
        visible: false
    })
};

// Map initialization
const map = new ol.Map({
    target: 'map',
    layers: Object.values(layers),
    view: new ol.View({
        center: ol.proj.fromLonLat([37.6173, 55.7558]),
        zoom: 10
    })
});

function toggleLayerMenu() {
    const menu = document.getElementById('layer-menu');
    menu.classList.toggle('open');
}

function setLayer(layerId) {
    // Set all layers to invisible
    Object.keys(layers).forEach(id => {
        layers[id].setVisible(false);
    });
    
    // Set selected layer to visible
    layers[layerId].setVisible(true);
    
    // Update active class in menu
    const options = document.querySelectorAll('.layer-option');
    options.forEach(opt => {
        opt.classList.remove('active');
        if (opt.innerText.includes(getLayerName(layerId))) {
            opt.classList.add('active');
        }
    });
    
    // Close menu
    toggleLayerMenu();
}

function getLayerName(id) {
    const names = {
        osm: 'Стандартная',
        satellite: 'Спутник',
        hybrid: 'Гибрид',
        terrain: 'Рельеф'
    };
    return names[id];
}

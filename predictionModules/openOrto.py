# Import necessary modules
import rasterio                     # rasterio is used for manipulating geospatial raster data like satellite imagery
from rasterio.windows import Window # To manipulate rectangular subsets of raster datasets
import rasterio.mask                # For masking operations with rasterio
import numpy                        # numpy for array related operations
import numpy as np                  # numpy is aliased as np for convenience
import cv2                          # cv2 for image related operations

from keras.models import load_model # To load our previously trained keras model

from main import getPrediction      # Importing our function getPrediction from the main file

from shapely import geometry        # shapely for manipulating and analyzing planar geometric objects


# This is the path to the file 
fp = r'green_ai\komprimerad_Orto2019EPSG3009.tif'

class ortophoto():
    '''
    This class represents an ortophoto.
    '''
    def __init__(self, orto_path, model_path1, model_path2) -> None:
        '''
        Initializes the ortophoto object.
        
        @param orto_path: Path to the ortophoto (GeoTif).
        @param model_path1: Path to the first model.
        @param model_path2: Path to the second model.
        '''
        self.orto = rasterio.open(orto_path)
        self.model1 = load_model(model_path1,compile=False) # Load the first model
        self.model2 = load_model(model_path2,compile=False) # Load the second model

    def crop_poly(self, coords: list) -> numpy.ndarray:
        '''
        Crops the image into a polygon with given corners.
        
        @param coords: List of coordinates of the polygon's corners.
        '''
        pix_coords = []
        for coord in coords:
            py, px = self.orto.index(coord[1],coord[0]) # Convert the coordinate to pixel coordinate
            pix_coords.append((px,py))
        
        pts = np.array(pix_coords)

        rect = cv2.boundingRect(pts) # Get the bounding rectangle of the polygon

        x,y,w,h = rect
        poly = geometry.Polygon([[p[1], p[0]] for p in coords]) # Create the polygon

        window = Window(x,y,w,h)
        im = self.orto.read(window=window).T

        out_image,out_transform=rasterio.mask.mask(self.orto,[poly], crop=True) # Crop the image

        out_meta = self.orto.meta

        out_meta.update({"driver": "GTiff", # Update the metadata
                 "height": out_image.shape[1],
                 "width": out_image.shape[2],
                 "transform": out_transform})
            
        im = out_image.T # Transpose the output image

        self.poly_area = cv2.cvtColor(im, cv2.COLOR_RGB2BGR) # Convert the image from RGB to BGR

    def pred(self,callback):
        '''
        Runs the GAI prediction on the cropped area.

        @param callback: Callback function for the progressbar.
        '''
        self.seg_img, self.large_img = getPrediction(self.poly_area, self.model1, self.model2, callback)

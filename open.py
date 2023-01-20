import rasterio
from rasterio.plot import show
from rasterio.windows import Window
import numpy
import numpy as np
import cv2

from keras.models import load_model

from main import getPrediction


fp = r'green_ai\komprimerad_Orto2019EPSG3009.tif'

class ortophoto():
    '''
    Loads ortophoto
    
    @param path: path to ortophoto (GeoTif)
    '''
    def __init__(self, orto_path, model_path) -> None:
        self.orto = rasterio.open(orto_path) #Loads image
        self.model = load_model(model_path, compile=False)

    def crop_poly(self, coords: list) -> numpy.ndarray:
        '''
        Crops the image into a polygon with given corners.

        @param coords: coords of the polygons corners.
        '''

        pix_coords = []
        for coord in coords:
            py, px = self.orto.index(coord[1],coord[0])
            # py = py-self.u_l[1] 

            pix_coords.append((px,py))
        
        pts = np.array(pix_coords)

        ## crop the bounding rect
        rect = cv2.boundingRect(pts)
        x,y,w,h = rect

        window = Window(x,y,w,h)
        im = self.orto.read(window=window).T

        # cropped = im[y:y+h, x:x+w].copy()
        cropped = im

        

        
        ## make mask
        pts = pts - pts.min(axis=0)

        mask = np.zeros(cropped.shape[:2], np.uint8)
        cv2.drawContours(mask, [pts], -1, (255, 255, 255), -1, cv2.LINE_AA) #makes the polygon.

        ## do bit-op
        dst = cv2.bitwise_and(cropped, cropped, mask=mask)

        self.poly_area = cv2.cvtColor(dst, cv2.COLOR_RGB2BGR)
        # cv2.imwrite('C:/crop_orto/area_of_interest.png', dst2)

        # return dst2
        # cv2.imwrite('C:/crop_orto/area_of_interest.png', self.poly_area)


    def pred(self):
        self.gyf = getPrediction(self.poly_area, self.model, False)
        


    


# lat, lng = 59.27392143148289, 15.206654796775117

# coord = [lng,lat]

# img = ortophoto(path=fp)
# x,y = img.wgs84_to_sweref(coord)

# print(x,y)

# coord=(6573210.52362,161778.12345)

# thr = 100
# coords = [(6573210.52362,161778.12345), (6573210.52362 + thr*2,161778.12345),(6573210.52362+thr,161778.12345+thr),(6573210.52362,161778.12345+thr)]

# img = ortophoto(path=fp)
# img.crop_to_coord(coord=coord)
# area = img.crop_poly(coords=coords)
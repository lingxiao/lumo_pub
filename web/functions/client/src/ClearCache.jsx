/**
 * 
 * @Module: Clear react app build
 * @Author: ammartin
 * @Date  : 1/27/2022
 * @Source: https://dev.to/ammartinwala52/clear-cache-on-build-for-react-apps-1k8j
 * 
*/



import React, { useState, useEffect } from "react";
import moment from "moment";

const buildDateGreaterThan = (latestDate, currentDate) => {
  const momLatestDateTime = moment(latestDate);
  const momCurrentDateTime = moment(currentDate);

  if (momLatestDateTime.isAfter(momCurrentDateTime)) {
    return true;
  } else {
    return false;
  }
};


// note this doesnt run unless
// the whole app is loaded
function withClearCache(Component) {

    function ClearCacheComponent(props) {

        const [ didClear, setDidClear ] = useState(false);

        useEffect(() => {
        if ( !didClear ){
            setDidClear(true);
            refreshCacheAndReload();
        }
        },[])

        const refreshCacheAndReload = () => {
        if (caches && caches.keys) {
            caches.keys().then((names) => {
                for (const name of names) {
                  caches.delete(name);
                }
            });
        // window.location.reload(true);
        }
        };

        return (
            <React.Fragment>
                <Component {...props} />
            </React.Fragment>
        );

    }

    return ClearCacheComponent;
}


/**
 * Function returning the build date(as per provided epoch)
 * @param epoch Time in milliseconds
 */
export const getBuildDate = (epoch) => {
  const buildDate = moment(epoch).format("DD-MM-YYY HH:MM");
  return buildDate;
};

export default withClearCache;
export { buildDateGreaterThan }
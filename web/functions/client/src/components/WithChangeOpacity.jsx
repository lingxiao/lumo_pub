/**
 *
 *
 * @Package: WithChangeOpacity
 * @Date   : Jan 28th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState} from "react";


/**
 *
 * @Use: change opacity of div 
 *       on mouse down, then return  
 *       to full opacity
 *
 **/
export default function WithChangeOpacity(props){

    const [ op, setop ] = useState(1.0);
	const { onClick, children, style } = props;

    function onMouseDown(){
    	setop(0.5)
    }

    function onMouseUp(){
    	setop(1.0)
    }

    function _onClick(){
    	if ( typeof onClick === 'function' ){
    		onClick();
    	}
    }

	return (
		<div style={{opacity:op, cursor: 'pointer'}} onMouseUp={onMouseUp} onMouseDown={onMouseDown} onClick={_onClick}>
			{children}
        </div>     	  
	)

}
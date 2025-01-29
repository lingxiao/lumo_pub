/**
 * @Package: iphonepreview.jsx
 * @Date   : 9-10-2022
 * @Author : Xiao Ling   
 * @Docs:
 *   - https://medium.com/@TylerStober/creating-an-iphone-in-css-35e35de7076
 *
*/

 
import React, {Component} from 'react'
import { COLORS } from './constants';
import './iphoneShape.css';


export default function PhonePreview({ style, img_src, }){

    return (

        <figure class="iphone">

            <div class="phone">
            </div>


        </figure>

    )
}

/**

          <figure class="iphone">

            <div class="side-buttons">
              <div></div>
            </div>

            <div class="phone">
              <div class="top">
                <div>
                  <span class="camera"></span>
                  <span class="speaker"></span>
                </div>
              </div>

              <div class="screen">
                <img src=""/>
              </div>

              <div class="bottom">
                <div></div>
              </div>
            </div>

          </figure>
*/
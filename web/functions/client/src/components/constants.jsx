/**
 * @Package: constants.jsx
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import { LoremIpsum } from "lorem-ipsum";


/******************************************************
		@styles + contants
******************************************************/

const punk  = 'https://d7hftxdivxxvm.cloudfront.net/?resize_to=width&src=https%3A%2F%2Fd32dm0rphc51dk.cloudfront.net%2FGwUiJa9FiNbnQkAboOSBlA%2Flarger.jpg&width=1200&quality=80'


const nifty_url = {
	preview: 'https://lh3.googleusercontent.com/gqvYS24xfrhIr1ougYdgvA9LQxNXTzBbs-JvTZA2Y872GkOKd9WK8lJ5uuZM6Qsy6PsPDPJiorp3f718t6Mb-mG_bXzr-fREtOAYhQ=s250',
	thumb: 'https://lh3.googleusercontent.com/gqvYS24xfrhIr1ougYdgvA9LQxNXTzBbs-JvTZA2Y872GkOKd9WK8lJ5uuZM6Qsy6PsPDPJiorp3f718t6Mb-mG_bXzr-fREtOAYhQ=s128',
	full: 'https://lh3.googleusercontent.com/gqvYS24xfrhIr1ougYdgvA9LQxNXTzBbs-JvTZA2Y872GkOKd9WK8lJ5uuZM6Qsy6PsPDPJiorp3f718t6Mb-mG_bXzr-fREtOAYhQ',
}

const translucent = 'rgba(255,255,255,0.1)';
const transparent = 'rgba(0,0,0,0.0)';
const white = `rgba(255,255,255,1.0)`


// convert color: https://convertingcolors.com/rgb-color-153_45_37.html?search=RGB(153,45,37)
const COLORS = {
		white      : white,
		offwhite   : `rgba(255,255,255,0.75)`,
		offwhite_2 : `rgba(152,147,133,1)`,
		offwhite_filter: 'brightness(10%) invert(90%) sepia(10%)',
		
		black      : 'rgba(0,0,0,1.0)',
		offBlack   : '#0c0c0c', // `rgba(7,8,7,255)`,
		offBlack2  : '#111111', 
		offBlack3  : '#161616',

		// surface
    	surface1: '#161616',
    	surface2: '#1b1b1b',
    	surface3: '#242424',
    	backgroundDark: '#0c0c0c',

    	// font
    	text : '#F2F2F2',
    	text2: '#CDCDCD',
    	text3: '#ABABAB',

		// clear
		translucent: translucent,
		translucent2: 'rgba(255,255,255,0.25)',
		translucent3: 'rgba(255,255,255,0.50)',
		translucent4: 'rgba(255,255,255,0.75)',

		transparentDark1: 'rgba(0,0,0,0.75)',
		transparentDark2: 'rgba(0,0,0,0.50)',
		transparentDark3: 'rgba(0,0,0,0.25)',

		transparent: transparent,

		// accents
		red        : 'red',
		red_1      : 'rgb(55,0,0)',
		red_2      : 'rgb(156,28,12)',
		red_3      : `rgb(153,45,37)`,
		green_1    : 'green',
		purple_1   : '#804c7c',
}

/**

	--theme-ui-colors-background: #111111;
    --theme-ui-colors-text: #F2F2F2;
    --theme-ui-colors-text2: #CDCDCD;
    --theme-ui-colors-text3: #ABABAB;
    --theme-ui-colors-surface1: #161616;
    --theme-ui-colors-surface2: #1b1b1b;
    --theme-ui-colors-surface3: #242424;
    --theme-ui-colors-border1: #262626;
    --theme-ui-colors-border2: #333333;
    --theme-ui-colors-border3: #4B4B4B;
    --theme-ui-colors-primary: #FFC061;
    --theme-ui-colors-red: #FF6466;
    --theme-ui-colors-redMuted: #B3494B;
    --theme-ui-colors-green: #A7FF88;
    --theme-ui-colors-purple: #A792C9;
    --theme-ui-colors-purpleMuted: #6F6185;
    --theme-ui-colors-backgroundDark: #0c0c0c;
*/

const lorem = new LoremIpsum({
		sentencesPerParagraph: {
				max: 8,
				min: 4
		},
		wordsPerSentence: {
				max: 16,
				min: 4
		}
});


function getCube(n){
	let k = Math.min(n,225)
	return require(`./../assets/incomplete_cubes/IncompleteCube${k}.png`)
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}    


function getRandomArbitrary(min, max) {
 	return Math.round(Math.random() * (max - min) + min);
}



export {
		lorem,
		COLORS,
		punk,
		getCube,
		getRandomInt,
		nifty_url,
		getRandomArbitrary
}
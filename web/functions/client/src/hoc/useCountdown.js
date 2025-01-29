/**
 *
 *
 * @Package: coutndowntimer
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
 * @Doc: https://blog.greenroots.info/how-to-create-a-countdown-timer-using-react-hooks
 *
 *
**/


import {useState, useEffect} from 'react'

import {
	swiftNow,
} from './../model/utils';


const useCountdown = (targetDate) => {

	const countDownDate = new Date(targetDate).getTime();

	const [countDown, setCountDown] = useState(
		countDownDate - new Date().getTime()
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setCountDown(countDownDate - swiftNow());
		}, 1000);
		return () => clearInterval(interval);
	}, [countDownDate]);

	return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
	// calculate time left
	let convert_ratio = 1;
	const days = Math.floor(countDown / (convert_ratio*60 * 60 * 24));
	const hours = Math.floor(
		(countDown % (convert_ratio*60 * 60 * 24)) / (convert_ratio*60 * 60)
	);
	const minutes = Math.floor((countDown % (convert_ratio*60 * 60)) / (convert_ratio*60));
	const seconds = Math.floor((countDown % (convert_ratio*60)) / 1);
	return [Math.max(0,days), Math.max(0,hours), Math.max(0,minutes), Math.max(0,seconds)];
};


export default useCountdown;
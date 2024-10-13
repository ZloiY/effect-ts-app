import { useEffect, useState } from "react";

export const useDebounce = <T extends any>(callback: (params: T) => void, timeout: number = 300) => {
	const [tempParams, setParams] = useState<T | undefined>();

	useEffect(() => {
		let timeoutId: number;
		if (tempParams) {
			timeoutId = setTimeout(() => {
				callback(tempParams);
			}, timeout);
		}
		return () => {
			clearTimeout(timeoutId);
		};
	}, [tempParams]);

	return setParams;
};

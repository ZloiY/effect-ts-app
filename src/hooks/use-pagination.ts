import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { useCallback, useEffect, useMemo, useState } from "react";

type PaginationProps = {
	totalLength: number;
	pageSize: number;
	currentPage: O.Option<number>;
}

const getCurrentPageInRange = (lastPage: number, currentPage: number) =>
	currentPage > lastPage ? 0 : currentPage;

const calcPages = (totalLength: number, pageSize: number, currentPage: number) => {
	const totalPages = Math.ceil(totalLength / pageSize);
	const selectedPage = getCurrentPageInRange(totalPages, currentPage);
	const offset = (selectedPage + 1) * pageSize;

	const isNextPage = selectedPage < totalPages;
	const isPrevPage = selectedPage > 0;

	return { totalPages, selectedPage, isNextPage, isPrevPage, offset }
};

export const usePagination = (props: PaginationProps) => {
	const [currentPage, setCurrentPage] = useState(pipe(props.currentPage, O.getOrElse(() => 0)));
	const [totalLength, setTotalLength] = useState(props.totalLength);
	const [pageSize, setPageSize] = useState(props.pageSize);

	const { totalPages, selectedPage, isNextPage, isPrevPage, offset } = useMemo(() => calcPages(totalLength, pageSize, currentPage), [currentPage, totalLength, pageSize]);

	const goToNextPage = useCallback(() => {
		if (isNextPage) {
			setCurrentPage((currentPage) => currentPage + 1);
		}
	}, [isNextPage])

	const goToPrevPage = useCallback(() => {
		if (isPrevPage) {
			setCurrentPage((currentPage) => currentPage - 1);
		}
	}, [isPrevPage])

	return {
		setCurrentPage,
		setTotalLength,
		setPageSize,
		goToNextPage,
		goToPrevPage,
		offset,
		totalPages,
		selectedPage,
		isNextPage,
		isPrevPage,
	}
};


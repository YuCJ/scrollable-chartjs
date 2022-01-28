import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";

const getShouldBeScrollMode = ({
  minXTickWidth, // x軸一格可接受的最小寬度
  xTicksCount, // x軸有幾格
  wrapperWidth // 圖表顯示區塊的大小
}) => {
  const tickWidthIfNoScroll = wrapperWidth / xTicksCount
  const isScrollMode = tickWidthIfNoScroll < minXTickWidth
  return isScrollMode
}

export default function ScrollableBar({ minXTickWidth = 50, data, options }) {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const wrapperRef = useRef(null)
  const chartRef = useRef(null);
  const WRef = useRef(null);
  const currentNRef = useRef(null);
  const NRef = useRef(null);
  const isScrollModeRef = useRef(null);
  const nxRef = useRef(null);

  const getWrapperWidth = useCallback(
    () => wrapperRef.current?.getBoundingClientRect().width,
    []
  )

  const optionsBasedOnIsScrollMode = useMemo(
    () => ({
      ...options,
      responsive: !isScrollMode,
    }),
    [isScrollMode, options]
  );

  const n = useMemo(() => {
    const result = data.datasets.reduce((acc, curr) => {
      if (curr.data.length > acc) {
        return curr.data.length;
      }
      return acc;
    }, 0);
    currentNRef.current = result;
    return result;
  }, [data]);

  const resizeChartBasedPointNumber = useCallback(({ forceResize } = {}) => {
    if (isScrollModeRef.current === null || nxRef.current === null) {
      return;
    }

    if (forceResize || isScrollModeRef.current === true) {
      chartRef.current.resize(
        nxRef.current +
          chartRef.current.width -
          chartRef.current.chartArea.width,
        350
      );
    }
  }, []);

  const goScrollMode = useCallback(() => {
    WRef.current = getWrapperWidth();
    NRef.current = currentNRef.current;
    resizeChartBasedPointNumber({ forceResize: true });
    setIsScrollMode(true);
  }, [getWrapperWidth, resizeChartBasedPointNumber]);

  const goRegularMode = useCallback(() => {
    WRef.current = null;
    setIsScrollMode(false);
  }, []);

  useEffect(() => {
    // console.log(`Current state: ${isScrollMode ? "Scroll" : "Regular"} Mode`);
    isScrollModeRef.current = isScrollMode;
  }, [isScrollMode]);

  useEffect(() => {
    nxRef.current = n * minXTickWidth;
  }, [n, minXTickWidth]);

  // handle n changes
  useEffect(() => {
    if (
      getShouldBeScrollMode({
        wrapperWidth: getWrapperWidth(),
        xTicksCount: n,
        minXTickWidth,
      })
    ) {
      goScrollMode();
    } else {
      goRegularMode()
    }
    // console.log(`handle n changes`);
  }, [n, minXTickWidth, goRegularMode, goScrollMode, getWrapperWidth]);

  // handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (
        getShouldBeScrollMode({
          wrapperWidth: getWrapperWidth(),
          xTicksCount: n,
          minXTickWidth,
        })
      ) {
        goScrollMode();
      } else {
        goRegularMode()
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [getWrapperWidth, goRegularMode, goScrollMode, minXTickWidth, n]);

  window.chartRef = chartRef.current;
  return (
    <div
      style={{
        position: "relative",
        minHeight: "350px",
        width: "100%",
        overflowX: "scroll",
      }}
      ref={wrapperRef}
    >
      <Line ref={chartRef} options={optionsBasedOnIsScrollMode} data={data} />
    </div>
  );
}

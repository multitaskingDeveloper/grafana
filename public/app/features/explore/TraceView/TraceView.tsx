import React, { useCallback, useMemo, useState } from 'react';
import {
  ThemeOptions,
  ThemeProvider,
  ThemeType,
  TracePageHeader,
  TraceTimelineViewer,
  transformTraceData,
  TTraceTimeline,
  UIElementsContext,
} from '@jaegertracing/jaeger-ui-components';
import { UIElements } from './uiElements';
import { useViewRange } from './useViewRange';
import { useSearch } from './useSearch';
import { useChildrenState } from './useChildrenState';
import { useDetailState } from './useDetailState';
import { useHoverIndentGuide } from './useHoverIndentGuide';
import { colors, useTheme } from '@grafana/ui';
import { TraceViewData, Trace, TraceSpan, TraceKeyValuePair, TraceLink } from '@grafana/data';
import { createSpanLinkFactory } from './createSpanLink';
import { useSelector } from 'react-redux';
import { StoreState } from 'app/types';
import { SplitOpen } from 'app/types/explore';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { TraceToLogsData } from 'app/core/components/TraceToLogsSettings';

type Props = {
  trace?: TraceViewData;
  splitOpenFn: SplitOpen;
};

export function TraceView(props: Props) {
  if (!props.trace?.traceID) {
    return null;
  }
  const { expandOne, collapseOne, childrenToggle, collapseAll, childrenHiddenIDs, expandAll } = useChildrenState();
  const {
    detailStates,
    toggleDetail,
    detailLogItemToggle,
    detailLogsToggle,
    detailProcessToggle,
    detailReferencesToggle,
    detailTagsToggle,
    detailWarningsToggle,
    detailStackTracesToggle,
  } = useDetailState();
  const { removeHoverIndentGuideId, addHoverIndentGuideId, hoverIndentGuideIds } = useHoverIndentGuide();
  const { viewRange, updateViewRangeTime, updateNextViewRangeTime } = useViewRange();

  /**
   * Keeps state of resizable name column width
   */
  const [spanNameColumnWidth, setSpanNameColumnWidth] = useState(0.25);
  /**
   * State of the top minimap, slim means it is collapsed.
   */
  const [slim, setSlim] = useState(false);

  const traceProp = useMemo(() => transformTraceData(props.trace), [props.trace]);
  const { search, setSearch, spanFindMatches } = useSearch(traceProp?.spans);
  const dataSourceName = useSelector((state: StoreState) => state.explore.left.datasourceInstance?.name);
  const traceToLogsOptions = (getDatasourceSrv().getInstanceSettings(dataSourceName)?.jsonData as TraceToLogsData)
    ?.tracesToLogs;

  const theme = useTheme();
  const traceTheme = useMemo(
    () =>
      ({
        type: theme.isDark ? ThemeType.Dark : ThemeType.Light,
        servicesColorPalette: colors,
        components: {
          TraceName: {
            fontSize: theme.typography.size.lg,
          },
        },
      } as ThemeOptions),
    [theme]
  );

  const traceTimeline: TTraceTimeline = useMemo(
    () => ({
      childrenHiddenIDs,
      detailStates,
      hoverIndentGuideIds,
      shouldScrollToFirstUiFindMatch: false,
      spanNameColumnWidth,
      traceID: traceProp?.traceID,
    }),
    [childrenHiddenIDs, detailStates, hoverIndentGuideIds, spanNameColumnWidth, traceProp?.traceID]
  );

  const createSpanLink = useMemo(() => createSpanLinkFactory(props.splitOpenFn, traceToLogsOptions), [
    props.splitOpenFn,
    traceToLogsOptions,
  ]);
  const scrollElement = document.getElementsByClassName('scrollbar-view')[0];

  if (!traceProp) {
    return null;
  }

  return (
    <ThemeProvider value={traceTheme}>
      <UIElementsContext.Provider value={UIElements}>
        <TracePageHeader
          canCollapse={false}
          clearSearch={useCallback(() => {}, [])}
          focusUiFindMatches={useCallback(() => {}, [])}
          hideMap={false}
          hideSummary={false}
          nextResult={useCallback(() => {}, [])}
          onSlimViewClicked={useCallback(() => setSlim(!slim), [])}
          onTraceGraphViewClicked={useCallback(() => {}, [])}
          prevResult={useCallback(() => {}, [])}
          resultCount={0}
          slimView={slim}
          textFilter={null}
          trace={traceProp}
          traceGraphView={false}
          updateNextViewRangeTime={updateNextViewRangeTime}
          updateViewRangeTime={updateViewRangeTime}
          viewRange={viewRange}
          searchValue={search}
          onSearchValueChange={setSearch}
          hideSearchButtons={true}
        />
        <TraceTimelineViewer
          registerAccessors={useCallback(() => {}, [])}
          scrollToFirstVisibleSpan={useCallback(() => {}, [])}
          findMatchesIDs={spanFindMatches}
          trace={traceProp}
          traceTimeline={traceTimeline}
          updateNextViewRangeTime={updateNextViewRangeTime}
          updateViewRangeTime={updateViewRangeTime}
          viewRange={viewRange}
          focusSpan={useCallback(() => {}, [])}
          createLinkToExternalSpan={useCallback(() => '', [])}
          setSpanNameColumnWidth={setSpanNameColumnWidth}
          collapseAll={collapseAll}
          collapseOne={collapseOne}
          expandAll={expandAll}
          expandOne={expandOne}
          childrenToggle={childrenToggle}
          clearShouldScrollToFirstUiFindMatch={useCallback(() => {}, [])}
          detailLogItemToggle={detailLogItemToggle}
          detailLogsToggle={detailLogsToggle}
          detailWarningsToggle={detailWarningsToggle}
          detailStackTracesToggle={detailStackTracesToggle}
          detailReferencesToggle={detailReferencesToggle}
          detailProcessToggle={detailProcessToggle}
          detailTagsToggle={detailTagsToggle}
          detailToggle={toggleDetail}
          setTrace={useCallback((trace: Trace | null, uiFind: string | null) => {}, [])}
          addHoverIndentGuideId={addHoverIndentGuideId}
          removeHoverIndentGuideId={removeHoverIndentGuideId}
          linksGetter={useCallback(
            (span: TraceSpan, items: TraceKeyValuePair[], itemIndex: number) => [] as TraceLink[],
            []
          )}
          uiFind={search}
          createSpanLink={createSpanLink}
          scrollElement={scrollElement}
        />
      </UIElementsContext.Provider>
    </ThemeProvider>
  );
}

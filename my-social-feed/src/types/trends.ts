export type TrendItem = {
  source: string;
  rank: number;
  keyword: string;
  url: string | null;
  volume: string | null;
  category: string | null;
};

export type SourceTrends = {
  source: string;
  label: string;
  items: TrendItem[];
  fetched_at: number;
  error: string | null;
};

export type TrendsResponse = {
  sources: SourceTrends[];
};

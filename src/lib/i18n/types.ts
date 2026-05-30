/** Shape of a complete translations object. One per language. */
export interface Translations {
  title: string
  name_label: string
  name_placeholder: string
  tables_q: string
  sel_all: string
  sel_none: string
  sel_hard: string
  sel_weak: string
  time_q: string
  mode_free: string
  mode_free_sub: string
  mode_5: string
  mode_5_sub: string
  mode_10: string
  mode_10_sub: string
  mode_20: string
  mode_20_sub: string
  start: string
  leaderboard_nav: string
  score_label: string
  check: string
  btn_quit: string
  praise: string[]
  timeout: (a: number, b: number, ans: number) => string
  wrong_ans: (a: number, b: number, ans: number) => string
  title_increible: string
  title_molt_be: string
  title_bona_feina: string
  title_ben_fet: string
  title_continua: string
  points: string
  stat_correct: string
  stat_wrong: string
  stat_streak: string
  new_record: string
  btn_replay: string
  btn_menu: string
  btn_leaderboard: string
  lb_title: string
  lb_tab_all: string
  lb_tab_free: string
  lb_tab_5: string
  lb_tab_10: string
  lb_tab_20: string
  lb_col_rank: string
  lb_col_name: string
  lb_col_score: string
  lb_col_hits: string
  lb_col_mode: string
  lb_mode_free: string
  lb_mode_timed: (s: string) => string
  lb_empty: string
  lb_back: string
  lb_clear: string
  no_data_alert: string
  clear_confirm: string
  default_name: string
  question_x_of_y: (x: number, total: number) => string
  // Game-type tab switcher
  game_tab_mult: string
  game_tab_ops: string
  // Operations game setup
  ops_q: string
  op_mult: string
  op_add: string
  op_sub: string
  op_div: string
  op_mult_hint: string
  op_add_hint: string
  op_sub_hint: string
  op_div_hint: string
  // Leaderboard report tab
  lb_tab_report: string
  report_no_users: string
  report_attempts: (n: number) => string
  report_weak_title: string
}

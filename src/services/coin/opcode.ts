// chia\types\condition_opcodes.py
export class ConditionOpcode {
  // # AGG_SIG is ascii "1"

  // # the conditions below require bls12-381 signatures

  public static AGG_SIG_UNSAFE = 49;
  public static AGG_SIG_ME = 50;

  // # the conditions below reserve coin amounts and have to be accounted for in output totals

  public static CREATE_COIN = 51;
  public static RESERVE_FEE = 52;

  // # the conditions below deal with announcements, for inter-coin communication

  public static CREATE_COIN_ANNOUNCEMENT = 60;
  public static ASSERT_COIN_ANNOUNCEMENT = 61;
  public static CREATE_PUZZLE_ANNOUNCEMENT = 62;
  public static ASSERT_PUZZLE_ANNOUNCEMENT = 63;

  // # the conditions below let coins inquire about themselves

  public static ASSERT_MY_COIN_ID = 70;
  public static ASSERT_MY_PARENT_ID = 71;
  public static ASSERT_MY_PUZZLEHASH = 72;
  public static ASSERT_MY_AMOUNT = 73;

  // # the conditions below ensure that we're "far enough" in the future

  // # wall-clock time
  public static ASSERT_SECONDS_RELATIVE = 80;
  public static ASSERT_SECONDS_ABSOLUTE = 81;

  // # block index
  public static ASSERT_HEIGHT_RELATIVE = 82;
  public static ASSERT_HEIGHT_ABSOLUTE = 83;
}


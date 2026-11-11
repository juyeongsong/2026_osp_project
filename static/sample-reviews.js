/* =========================================================
   예시 후기 데이터 (백엔드 연결 전 화면 확인용)
   Flask + DB를 붙이면 이 파일과 review-list.html의
   <script src="js/sample-reviews.js"> 줄을 지우면 돼요.
   항목 이름은 DB 컬럼 이름을 정할 때 참고해도 좋아요.
   - excerpt: 목록에 보이는 내용 일부 / content: 전체 내용 (없으면 excerpt를 그대로 씀)
   - photos : 첨부 사진 수 (예시라서 사진 대신 붕어빵 그림으로 보여줘요)
   ========================================================= */
window.SAMPLE_FLAVOR_NAMES = {"pat": "팥", "choux": "슈크림", "strawberry-choux": "딸기슈크림", "sweetpotato": "고구마", "matcha": "말차", "pizza": "피자"};

window.SAMPLE_REVIEWS = [
  {"id": 1, "user": "chooo9", "avatar": "green", "flavor": "pat", "rating": 5, "title": "팥 붕어빵 최고", "excerpt": "팥 붕어빵 역시 근본있네요. 너무 많이 달지 않고 고소해서 먹기 좋습니다.", "createdAt": "2026-10-09T15:00", "content": "팥 붕어빵 역시 근본있네요. 너무 많이 달지 않고 고소해서 먹기 좋습니다.\n붕어의 머리부터 꼬리까지 소가 꽉 차있어서 한 마리만 먹어도 든든합니다. 사장님 인심 최고!\n반죽도 바삭하게 넘 잘 구우시는 듯. 바삭 붕어빵 좋아하시면 이화 붕어빵 강력 추천합니다.\n저는 날이 추워지면 이화 붕어빵을 먹기 위해 매일 주머니에 현금 3천원을 들고 다닙니다.\n고물가 시대에 한 마리에 오백 원을 유지하는 이시대의 유일한 희망!\n오백원에 이 정도 퀄리티 정말 감동적입니다. 이화 붕어빵 번창하세요.", "photos": 4},
  {"id": 2, "user": "juyeong", "avatar": "brown", "flavor": "choux", "rating": 5, "title": "내 인생 - 이화 붕어빵 슈붕 = 0", "excerpt": "내인생은 이화붕어빵의 슈크림붕어빵을 만나기 전과후로 나뉜다. 이화붕어빵만나고나의성공시대시작", "createdAt": "2026-10-09T14:00", "photos": 3},
  {"id": 3, "user": "uzinee", "avatar": "purple", "flavor": "sweetpotato", "rating": 4, "title": "이화 붕어빵을 모르는 사람들 안타까움...", "excerpt": "겨울 간식 투탑 붕어빵과 군고구마의 만남 기쁘다", "createdAt": "2026-10-09T13:00", "photos": 2},
  {"id": 4, "user": "chonu", "avatar": "pink", "flavor": "sweetpotato", "rating": 5, "title": "고구마 붕어빵이 내 오소몰이다......", "excerpt": "추운 날씨엔 역시 손난로보다 고구마 붕어빵. 늘 한결같이 제게 힘이 됩니다.", "createdAt": "2026-10-09T12:00", "photos": 1},
  {"id": 5, "user": "6plus1.7", "avatar": "navy", "flavor": "sweetpotato", "rating": 5, "title": "고구마붕어빵 하트 나", "excerpt": "제가 먹어본 고구마 붕어빵 중에서 제일 맛있어요!", "createdAt": "2026-10-09T11:00", "photos": 4},
  {"id": 6, "user": "jimin", "avatar": "green", "flavor": "matcha", "rating": 5, "title": "쌉싸름한 말차", "excerpt": "말차 맛이 진하고 달지 않아서 어른 입맛에 딱이에요.", "createdAt": "2026-10-08T18:00", "photos": 3},
  {"id": 7, "user": "gaeun", "avatar": "green", "flavor": "sweetpotato", "rating": 5, "title": "고구마 덕후 인정", "excerpt": "고구마 알갱이가 씹혀서 진짜 군고구마 먹는 것 같아요.", "createdAt": "2026-10-07T23:00", "photos": 2},
  {"id": 8, "user": "yuna", "avatar": "pink", "flavor": "strawberry-choux", "rating": 5, "title": "딸기 향 가득", "excerpt": "딸기 크림이 상큼해서 디저트 먹는 기분이에요.", "createdAt": "2026-10-07T04:00", "photos": 1},
  {"id": 9, "user": "minji_ewha", "avatar": "navy", "flavor": "pat", "rating": 5, "title": "겉바속촉 정석", "excerpt": "반죽이 얇아서 팥이 훨씬 많이 느껴져요. 수업 끝나고 먹으면 딱이에요.", "createdAt": "2026-10-06T09:00", "photos": 4},
  {"id": 10, "user": "dain", "avatar": "pink", "flavor": "pizza", "rating": 5, "title": "이건 식사다", "excerpt": "치즈가 쭉 늘어나요. 단짠 좋아하면 꼭 드세요.", "createdAt": "2026-10-05T14:00", "photos": 3},
  {"id": 11, "user": "seojin", "avatar": "brown", "flavor": "sweetpotato", "rating": 5, "title": "가을 맛", "excerpt": "달콤한 고구마 소가 부드러워요. 우유랑 같이 먹으면 최고.", "createdAt": "2026-10-04T19:00", "photos": 2},
  {"id": 12, "user": "yerin", "avatar": "purple", "flavor": "choux", "rating": 5, "title": "슈크림 폭탄", "excerpt": "한 입 베어 물자마자 크림이 흘러나와요. 휴지 꼭 챙기세요.", "createdAt": "2026-10-04T00:00", "photos": 1},
  {"id": 13, "user": "hana", "avatar": "navy", "flavor": "matcha", "rating": 4, "title": "초록 붕어빵", "excerpt": "색이 이화 그린이라 더 정감 가요.", "createdAt": "2026-10-03T05:00", "photos": 4},
  {"id": 14, "user": "hyunji", "avatar": "purple", "flavor": "sweetpotato", "rating": 4, "title": "든든한 간식", "excerpt": "점심 대신 두 마리 먹었어요. 배불러요.", "createdAt": "2026-10-02T10:00", "photos": 3},
  {"id": 15, "user": "seoyeon22", "avatar": "brown", "flavor": "pat", "rating": 4, "title": "팥 듬뿍", "excerpt": "팥이 꼬리까지 들어 있어요. 조금 더 따뜻했으면 별 다섯 개!", "createdAt": "2026-10-01T15:00", "photos": 2},
  {"id": 16, "user": "jihye", "avatar": "brown", "flavor": "strawberry-choux", "rating": 4, "title": "색이 예뻐요", "excerpt": "분홍색 크림이 귀여워서 사진부터 찍었어요.", "createdAt": "2026-09-30T20:00", "photos": 1},
  {"id": 17, "user": "yujin.s", "avatar": "brown", "flavor": "pizza", "rating": 5, "title": "피자 붕어빵 신세계", "excerpt": "토마토 소스랑 치즈가 들어 있어서 피자 맛 그대로예요.", "createdAt": "2026-09-30T01:00", "photos": 4},
  {"id": 18, "user": "chaewon", "avatar": "navy", "flavor": "sweetpotato", "rating": 5, "title": "고구마 최고", "excerpt": "팥보다 고구마파인데 여기 고구마는 정말 맛있어요.", "createdAt": "2026-09-29T06:00", "photos": 3},
  {"id": 19, "user": "dahye_", "avatar": "navy", "flavor": "choux", "rating": 5, "title": "달달함 충전", "excerpt": "시험 기간에 당 떨어질 때 먹으면 기분이 좋아져요.", "createdAt": "2026-09-28T11:00", "photos": 2},
  {"id": 20, "user": "yeji", "avatar": "purple", "flavor": "matcha", "rating": 5, "title": "말차 라떼랑 찰떡", "excerpt": "카페 가기 전에 사서 같이 먹었어요.", "createdAt": "2026-09-27T16:00", "photos": 1},
  {"id": 21, "user": "hayoon", "avatar": "pink", "flavor": "pat", "rating": 5, "title": "아침 대용으로 최고", "excerpt": "1교시 전에 두 마리 사 먹었는데 든든해요.", "createdAt": "2026-09-26T21:00", "photos": 4},
  {"id": 22, "user": "boram", "avatar": "pink", "flavor": "sweetpotato", "rating": 4, "title": "꿀고구마", "excerpt": "고구마 소가 꿀처럼 달아요. 다음엔 말차도 먹어 볼게요.", "createdAt": "2026-09-26T02:00", "photos": 3},
  {"id": 23, "user": "somin", "avatar": "purple", "flavor": "strawberry-choux", "rating": 5, "title": "새 메뉴 성공", "excerpt": "딸기슈크림은 처음 먹어 봤는데 또 생각나요.", "createdAt": "2026-09-25T07:00", "photos": 2},
  {"id": 24, "user": "minseo", "avatar": "navy", "flavor": "pizza", "rating": 4, "title": "짭짤해요", "excerpt": "달지 않은 붕어빵 찾는 분께 추천해요.", "createdAt": "2026-09-24T12:00", "photos": 1},
  {"id": 25, "user": "sua0301", "avatar": "green", "flavor": "choux", "rating": 4, "title": "크림이 부드러워요", "excerpt": "너무 달지 않아서 여러 개 먹어도 안 질려요.", "createdAt": "2026-09-23T17:00", "photos": 4},
  {"id": 26, "user": "ara_lee", "avatar": "green", "flavor": "sweetpotato", "rating": 5, "title": "재구매 각", "excerpt": "친구들 것까지 사 갔는데 다들 좋아했어요.", "createdAt": "2026-09-22T22:00", "photos": 3},
  {"id": 27, "user": "soyeon_c", "avatar": "brown", "flavor": "matcha", "rating": 4, "title": "은은한 맛", "excerpt": "말차 향이 은은하게 나요. 호불호 없을 맛.", "createdAt": "2026-09-22T03:00", "photos": 2},
  {"id": 28, "user": "jiwoo.k", "avatar": "green", "flavor": "pat", "rating": 4, "title": "단골 됐어요", "excerpt": "일주일에 세 번은 오는 것 같아요. 팥은 여기가 제일 맛있어요.", "createdAt": "2026-09-21T08:00", "photos": 1},
  {"id": 29, "user": "nayeon", "avatar": "navy", "flavor": "strawberry-choux", "rating": 4, "title": "상큼달달", "excerpt": "딸기 맛이 진해요. 크림이 조금만 더 많았으면 좋겠어요.", "createdAt": "2026-09-20T13:00", "photos": 4},
  {"id": 30, "user": "ga_eun", "avatar": "green", "flavor": "pizza", "rating": 5, "title": "야식으로 최고", "excerpt": "저녁에 출출할 때 먹었는데 든든했어요.", "createdAt": "2026-09-19T18:00", "photos": 3},
  {"id": 31, "user": "eunbi", "avatar": "pink", "flavor": "choux", "rating": 5, "title": "따뜻할 때 드세요", "excerpt": "갓 나온 걸 먹으니까 크림이 푸딩처럼 녹아요.", "createdAt": "2026-09-18T23:00", "photos": 2}
];

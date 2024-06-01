package capstone.communityservice.domain.forum.repository;

import capstone.communityservice.domain.forum.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface FileRepository extends JpaRepository<File, Long> {

    @Modifying
    @Query("delete from File f WHERE f.id IN :ids")
    void deleteAllByIdIn(@Param("ids") List<Long> ids);
}
